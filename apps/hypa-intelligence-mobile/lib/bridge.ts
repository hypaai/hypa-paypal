import type { BridgeOrder, BridgeProfile } from '@/api/bridge';

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_NAMES: Record<Weekday, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

/** Only currencies the assistant's price check can read in a reply, so an unlisted amount is always caught. */
export const CURRENCIES = [
  { name: 'NGN', displayName: 'NGN · Nigerian naira' },
  { name: 'GHS', displayName: 'GHS · Ghanaian cedi' },
  { name: 'XOF', displayName: 'XOF · West African CFA franc' },
  { name: 'USD', displayName: 'USD · US dollar' },
  { name: 'GBP', displayName: 'GBP · British pound' },
  { name: 'EUR', displayName: 'EUR · Euro' },
];

/** "09:30" as "9:30 AM". */
export function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
}

/** Every half hour of the day, to pick an opening or closing time from. */
export const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const name = `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`;
  return { name, displayName: formatTime(name) };
});

/** What the owner types in the setup form; prices stay text until saved. */
export interface BridgeProfileForm {
  name: string;
  sells: string;
  currency: string;
  priceList: { name: string; price: string }[];
  hours: { day: Weekday; on: boolean; open: string; close: string }[];
  languages: string;
  tone: string;
}

export const emptyProfileForm = (): BridgeProfileForm => ({
  name: '',
  sells: '',
  currency: 'NGN',
  priceList: [{ name: '', price: '' }],
  hours: WEEKDAYS.map((day) => ({ day, on: false, open: '09:00', close: '18:00' })),
  languages: 'English',
  tone: '',
});

export const formFromProfile = (profile: BridgeProfile): BridgeProfileForm => ({
  name: profile.name,
  sells: profile.sells,
  currency: profile.currency,
  priceList: profile.priceList.length ? profile.priceList.map((row) => ({ name: row.name, price: String(row.price) })) : [{ name: '', price: '' }],
  hours: WEEKDAYS.map((day) => {
    const found = Array.isArray(profile.hours) ? profile.hours.find((value) => value.day === day) : undefined;
    return { day, on: !!found, open: found?.open ?? '09:00', close: found?.close ?? '18:00' };
  }),
  languages: profile.languages.join(', '),
  tone: profile.tone ?? '',
});

/** Turns the form into what the API accepts, or says what is wrong in plain words. */
export function profileFromForm(form: BridgeProfileForm): { profile: BridgeProfile } | { error: string } {
  const name = form.name.trim();
  if (!name) return { error: 'Add your business name.' };
  const currency = form.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return { error: 'Currency is a 3-letter code, like NGN or USD.' };

  const priceList: BridgeProfile['priceList'] = [];
  for (const row of form.priceList) {
    const itemName = row.name.trim();
    const raw = row.price.trim().replace(/,/g, '');
    if (!itemName && !raw) continue;
    const price = Number(raw);
    if (!itemName || !raw || !Number.isFinite(price) || price < 0) return { error: `Check the price for "${itemName || 'an item'}".` };
    priceList.push({ name: itemName, price });
  }
  if (!priceList.length) return { error: 'Add at least one item with a price. The assistant only quotes prices from this list.' };

  const hours: NonNullable<BridgeProfile['hours']> = [];
  for (const row of form.hours) {
    if (!row.on) continue;
    if (row.close <= row.open) return { error: `${WEEKDAY_NAMES[row.day]} must close after it opens.` };
    hours.push({ day: row.day, open: row.open, close: row.close });
  }

  const languages = form.languages.split(',').map((language) => language.trim()).filter(Boolean);
  return {
    profile: {
      name,
      sells: form.sells.trim(),
      currency,
      priceList,
      ...(hours.length ? { hours } : {}),
      languages,
      ...(form.tone.trim() ? { tone: form.tone.trim() } : {}),
    },
  };
}

/** The order's total from its own line prices, or from the price list; undefined while any line has no price. */
export function orderTotal(order: BridgeOrder, profile?: BridgeProfile): number | undefined {
  let total = 0;
  for (const line of order.items) {
    const listed = profile?.priceList.find((row) => row.name.trim().toLowerCase() === line.name.trim().toLowerCase())?.price;
    const unit = line.unitPrice ?? listed;
    if (unit === undefined) return undefined;
    total += unit * line.qty;
  }
  return total;
}

export const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
};

export const alertMessage = (alert: string | null) =>
  alert === 'low_balance'
    ? 'Your balance is too low, so the assistant has stopped answering. Top up to start again.'
    : alert === 'profile_incomplete'
      ? 'Your business profile is incomplete, so the assistant is not answering. Finish it to start again.'
      : alert
        ? 'The assistant needs your attention.'
        : null;

export function timeAgo(iso: string, now = Date.now()) {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/** "Today", "Yesterday", or the date, for the day dividers in a conversation. */
export function dayLabel(iso: string, now = Date.now()) {
  const date = new Date(iso);
  const midnight = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const days = Math.round((midnight(new Date(now)) - midnight(date)) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString([], { day: 'numeric', month: 'short', ...(date.getFullYear() === new Date(now).getFullYear() ? {} : { year: 'numeric' }) });
}

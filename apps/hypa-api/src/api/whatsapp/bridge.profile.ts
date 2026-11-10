import { z } from 'zod';

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const WEEKDAY_NAMES = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' } as const;

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** A day the business is open. Days left out are closed. */
const openDay = z
  .object({ day: z.enum(WEEKDAYS), open: time, close: time })
  .refine((value) => value.close > value.open, { message: 'A day must close after it opens' });

const priceItem = z.object({
  name: z.string().trim().min(1).max(120),
  price: z.coerce.number().nonnegative().max(1_000_000_000),
});

/** What the owner sets up in the app: the only facts the agent may use about the business. */
export const businessProfileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sells: z.string().trim().max(500).default(''),
  currency: z.string().regex(/^[A-Za-z]{3}$/).transform((value) => value.toUpperCase()),
  priceList: z.array(priceItem).max(200).default([]),
  hours: z
    .array(openDay)
    .max(7)
    .refine((days) => new Set(days.map((value) => value.day)).size === days.length, { message: 'A day is listed twice' })
    .optional(),
  languages: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  tone: z.string().trim().max(200).optional(),
});

export type BusinessProfile = z.infer<typeof businessProfileSchema>;

/** The opening hours as the agent reads them: the days open with their times, then the days closed. */
export function hoursText(hours: BusinessProfile['hours']): string {
  if (!hours?.length) return 'not given';
  const open = WEEKDAYS.flatMap((day) => {
    const found = hours.find((value) => value.day === day);
    return found ? [`${WEEKDAY_NAMES[day]} ${found.open}-${found.close}`] : [];
  });
  const closed = WEEKDAYS.filter((day) => !hours.some((value) => value.day === day)).map((day) => WEEKDAY_NAMES[day]);
  return `${open.join(', ')}${closed.length ? `; closed ${closed.join(', ')}` : ''} (24-hour times)`;
}

export interface OrderLine {
  name: string;
  qty: number;
  size?: string;
  color?: string;
  unitPrice?: number;
}

const normal = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();
const same = (a: number, b: number) => Math.abs(a - b) < 0.005;

/** Price-list rows that name this item: an exact match, or one name inside the other ("agbada" in "agbada (men)"). */
function listed(profile: BusinessProfile, name: string) {
  const wanted = normal(name);
  const exact = profile.priceList.filter((row) => normal(row.name) === wanted);
  if (exact.length) return exact;
  return profile.priceList.filter((row) => {
    const have = normal(row.name);
    return wanted.length >= 3 && have.length >= 3 && (have.includes(wanted) || wanted.includes(have));
  });
}

/** What is wrong with the prices on an order: a price must be the one on the price list. */
export function orderPriceProblems(profile: BusinessProfile, items: OrderLine[]): string[] {
  const problems: string[] = [];
  for (const item of items) {
    if (item.unitPrice === undefined) continue;
    const rows = listed(profile, item.name);
    if (!rows.length) {
      problems.push(`"${item.name}" is not on the price list, so it cannot be given a price. Leave unitPrice out and put it in missing.`);
    } else if (!rows.some((row) => same(row.price, item.unitPrice!))) {
      problems.push(`"${item.name}" costs ${rows.map((row) => row.price).join(' or ')} ${profile.currency} on the price list, not ${item.unitPrice}.`);
    }
  }
  return problems;
}

/** Each line's price: the one given, or the price list's when it has just one. */
export function orderLinePrice(profile: BusinessProfile, item: OrderLine): number | undefined {
  if (item.unitPrice !== undefined) return item.unitPrice;
  const rows = listed(profile, item.name);
  return rows.length === 1 ? rows[0].price : undefined;
}

export function orderTotal(profile: BusinessProfile, items: OrderLine[]): number | undefined {
  const prices = items.map((item) => orderLinePrice(profile, item));
  if (prices.some((price) => price === undefined)) return undefined;
  return items.reduce((sum, item, index) => sum + item.qty * prices[index]!, 0);
}

/** Money amounts written in a reply: after a currency sign or code, or before a currency word. */
export function moneyIn(text: string): number[] {
  const amount = String.raw`(\d[\d,]*(?:\.\d+)?)`;
  const before = String.raw`(?:₦|\$|€|£|(?<![A-Za-z])(?:NGN|USD|EUR|GBP|GHS|XOF|CFA|N))\s?`;
  const after = String.raw`\s?(?:naira|dollars?|euros?|pounds?|cedis?|NGN|USD|EUR|GBP|GHS|XOF|CFA)(?![A-Za-z])`;
  const pattern = new RegExp(`${before}${amount}|${amount}${after}`, 'gi');
  const found: number[] = [];
  for (const match of text.matchAll(pattern)) {
    const value = Number((match[1] ?? match[2]).replace(/,/g, ''));
    if (Number.isFinite(value)) found.push(value);
  }
  return found;
}

/**
 * Amounts in a reply that are neither a price-list price nor something the order adds up to
 * (a line total or the order total). A reply with any of these is never sent without the owner.
 */
export function unlistedAmounts(profile: BusinessProfile, text: string, items: OrderLine[] = []): number[] {
  const allowed = profile.priceList.map((row) => row.price);
  items.forEach((item) => {
    const price = orderLinePrice(profile, item);
    if (price !== undefined) allowed.push(item.qty * price);
  });
  const total = orderTotal(profile, items);
  if (total !== undefined) allowed.push(total);
  return moneyIn(text).filter((value) => !allowed.some((price) => same(price, value)));
}

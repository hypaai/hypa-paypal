import assert from 'node:assert/strict';
import test from 'node:test';

import type { BridgeOrder, BridgeProfile } from '@/api/bridge';
import { alertMessage, dayLabel, formatTime, emptyProfileForm, formFromProfile, orderTotal, profileFromForm, timeAgo } from './bridge';

const profile: BridgeProfile = {
  name: "Ada's Tailoring",
  sells: 'native wear',
  currency: 'NGN',
  priceList: [
    { name: 'Agbada', price: 85000 },
    { name: 'Senator', price: 35000 },
  ],
  languages: ['English', 'Pidgin'],
};

test('profileFromForm builds a profile, dropping empty rows and commas in prices', () => {
  const form = { ...emptyProfileForm(), name: ' Ada ', currency: 'ngn', priceList: [{ name: 'Agbada', price: '85,000' }, { name: '', price: '' }], languages: 'English, Pidgin, ' };
  const result = profileFromForm(form);
  assert.ok('profile' in result);
  assert.deepEqual(result.profile, { name: 'Ada', sells: '', currency: 'NGN', priceList: [{ name: 'Agbada', price: 85000 }], languages: ['English', 'Pidgin'] });
});

test('profileFromForm says what is wrong in plain words', () => {
  const good = { ...emptyProfileForm(), name: 'Ada', priceList: [{ name: 'Agbada', price: '85000' }] };
  assert.deepEqual(profileFromForm({ ...good, name: ' ' }), { error: 'Add your business name.' });
  assert.match((profileFromForm({ ...good, currency: 'NAIRA' }) as { error: string }).error, /3-letter/);
  assert.match((profileFromForm({ ...good, priceList: [{ name: 'Agbada', price: 'free' }] }) as { error: string }).error, /Agbada/);
  assert.match((profileFromForm({ ...good, priceList: [{ name: '', price: '' }] }) as { error: string }).error, /at least one item/);
});

test('formFromProfile round-trips through profileFromForm', () => {
  const result = profileFromForm(formFromProfile(profile));
  assert.deepEqual('profile' in result && result.profile, profile);
});

test('orderTotal uses the line price, then the price list, and gives up when a price is unknown', () => {
  const order: BridgeOrder = { items: [{ name: 'agbada', qty: 2 }, { name: 'Senator', qty: 1, unitPrice: 30000 }], notes: '', missing: [] };
  assert.equal(orderTotal(order, profile), 200000);
  assert.equal(orderTotal({ ...order, items: [{ name: 'Cap', qty: 1 }] }, profile), undefined);
  assert.equal(orderTotal({ ...order, items: [{ name: 'Cap', qty: 1, unitPrice: 2000 }] }), 2000);
});

test('alertMessage explains why the assistant stopped', () => {
  assert.match(alertMessage('low_balance') ?? '', /balance is too low/);
  assert.match(alertMessage('profile_incomplete') ?? '', /profile is incomplete/);
  assert.equal(alertMessage(null), null);
});

test('timeAgo is short and never negative', () => {
  const now = Date.parse('2026-11-10T12:00:00Z');
  assert.equal(timeAgo('2026-11-10T11:59:40Z', now), 'now');
  assert.equal(timeAgo('2026-11-10T11:15:00Z', now), '45m');
  assert.equal(timeAgo('2026-11-10T07:00:00Z', now), '5h');
  assert.equal(timeAgo('2026-11-07T12:00:00Z', now), '3d');
  assert.equal(timeAgo('2026-11-10T12:05:00Z', now), 'now');
});

test('dayLabel names today and yesterday, and dates the rest', () => {
  const now = new Date(2026, 10, 10, 12, 0).getTime();
  assert.equal(dayLabel(new Date(2026, 10, 10, 0, 5).toISOString(), now), 'Today');
  assert.equal(dayLabel(new Date(2026, 10, 9, 23, 55).toISOString(), now), 'Yesterday');
  assert.equal(dayLabel(new Date(2026, 9, 2, 9, 0).toISOString(), now), new Date(2026, 9, 2).toLocaleDateString([], { day: 'numeric', month: 'short' }));
});

test('opening hours go from the form to the profile, and back', () => {
  const form = emptyProfileForm();
  form.name = 'Ada';
  form.priceList = [{ name: 'Agbada', price: '85000' }];
  form.hours = form.hours.map((row) => (row.day === 'mon' || row.day === 'sat' ? { ...row, on: true, close: row.day === 'sat' ? '14:00' : row.close } : row));
  const result = profileFromForm(form);
  assert.ok('profile' in result);
  assert.deepEqual(result.profile.hours, [{ day: 'mon', open: '09:00', close: '18:00' }, { day: 'sat', open: '09:00', close: '14:00' }]);
  assert.deepEqual(formFromProfile(result.profile).hours.filter((row) => row.on).map((row) => row.day), ['mon', 'sat']);
  assert.equal('hours' in (profileFromForm({ ...form, hours: emptyProfileForm().hours }) as { profile: object }).profile, false);
});

test('a day that closes before it opens is explained', () => {
  const form = { ...emptyProfileForm(), name: 'Ada', priceList: [{ name: 'Agbada', price: '85000' }] };
  form.hours = form.hours.map((row) => (row.day === 'fri' ? { ...row, on: true, open: '18:00', close: '09:00' } : row));
  assert.deepEqual(profileFromForm(form), { error: 'Friday must close after it opens.' });
});

test('formatTime reads like a clock', () => {
  assert.equal(formatTime('00:00'), '12:00 AM');
  assert.equal(formatTime('09:30'), '9:30 AM');
  assert.equal(formatTime('12:00'), '12:00 PM');
  assert.equal(formatTime('18:00'), '6:00 PM');
});

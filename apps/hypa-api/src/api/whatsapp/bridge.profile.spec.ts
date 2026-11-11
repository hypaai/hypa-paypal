import { businessProfileSchema, hoursText, moneyIn, orderPriceProblems, orderTotal, unlistedAmounts } from './bridge.profile';

const profile = businessProfileSchema.parse({
  name: 'Mama Ade Tailors',
  sells: 'Agbada and ankara outfits',
  currency: 'ngn',
  priceList: [
    { name: 'Agbada', price: 45000 },
    { name: 'Ankara gown', price: '25000' },
    { name: 'Cap', price: 5000 },
  ],
  languages: ['Yoruba', 'English'],
});

describe('business profile', () => {
  it('upper-cases the currency and reads prices sent as text', () => {
    expect(profile.currency).toBe('NGN');
    expect(profile.priceList[1].price).toBe(25000);
  });

  it('rejects a profile without a name or with a bad currency', () => {
    expect(businessProfileSchema.safeParse({ name: '', currency: 'NGN' }).success).toBe(false);
    expect(businessProfileSchema.safeParse({ name: 'X', currency: 'naira' }).success).toBe(false);
  });
});

describe('opening hours', () => {
  const base = { name: 'X', currency: 'NGN' };

  it('reads a schedule and says the days left out are closed', () => {
    const parsed = businessProfileSchema.parse({ ...base, hours: [{ day: 'mon', open: '09:00', close: '18:00' }, { day: 'sat', open: '10:00', close: '14:00' }] });
    expect(hoursText(parsed.hours)).toBe('Monday 09:00-18:00, Saturday 10:00-14:00; closed Tuesday, Wednesday, Thursday, Friday, Sunday (24-hour times)');
    expect(hoursText(undefined)).toBe('not given');
  });

  it('rejects a day that closes before it opens, a bad time, and a repeated day', () => {
    expect(businessProfileSchema.safeParse({ ...base, hours: [{ day: 'mon', open: '18:00', close: '09:00' }] }).success).toBe(false);
    expect(businessProfileSchema.safeParse({ ...base, hours: [{ day: 'mon', open: '9am', close: '18:00' }] }).success).toBe(false);
    expect(businessProfileSchema.safeParse({ ...base, hours: [{ day: 'mon', open: '09:00', close: '12:00' }, { day: 'mon', open: '13:00', close: '18:00' }] }).success).toBe(false);
    expect(businessProfileSchema.safeParse({ ...base, hours: 'Mon-Sat 8am' }).success).toBe(false);
  });
});

describe('orderPriceProblems', () => {
  it('accepts the listed price, and items left without a price', () => {
    expect(orderPriceProblems(profile, [{ name: 'agbada', qty: 2, unitPrice: 45000 }, { name: 'Ankara gown', qty: 1 }])).toEqual([]);
  });

  it('refuses a price that differs from the list, naming the right one', () => {
    const [problem] = orderPriceProblems(profile, [{ name: 'Agbada', qty: 2, unitPrice: 40000 }]);
    expect(problem).toContain('45000');
    expect(problem).toContain('not 40000');
  });

  it('refuses a price for an item that is not on the list', () => {
    expect(orderPriceProblems(profile, [{ name: 'Wedding set', qty: 1, unitPrice: 90000 }])[0]).toContain('not on the price list');
  });

  it('matches a longer name that contains the listed one', () => {
    expect(orderPriceProblems(profile, [{ name: 'blue agbada (men)', qty: 1, unitPrice: 45000 }])).toEqual([]);
  });
});

describe('orderTotal', () => {
  it('adds quantity times the price, taking the list price when none is given', () => {
    expect(orderTotal(profile, [{ name: 'Agbada', qty: 2 }, { name: 'Cap', qty: 1, unitPrice: 5000 }])).toBe(95000);
  });

  it('is unknown while an item has no price', () => {
    expect(orderTotal(profile, [{ name: 'Agbada', qty: 2 }, { name: 'Wedding set', qty: 1 }])).toBeUndefined();
  });
});

describe('moneyIn', () => {
  it.each([
    ['It is ₦45,000', [45000]],
    ['NGN 45000 and N5,000', [45000, 5000]],
    ['45,000 naira', [45000]],
    ['$25.50 or 25 USD', [25.5, 25]],
    ['Ready by Saturday, 2 pieces, size 42', []],
    ['The Nigeria office, number 12', []],
  ])('finds the amounts in %s', (text, amounts) => {
    expect(moneyIn(text)).toEqual(amounts);
  });
});

describe('unlistedAmounts', () => {
  const order = [{ name: 'Agbada', qty: 2 }, { name: 'Cap', qty: 1 }];

  it('allows list prices, line totals and the order total', () => {
    expect(unlistedAmounts(profile, 'Agbada is ₦45,000. Two are ₦90,000, with the cap ₦95,000.', order)).toEqual([]);
  });

  it('flags an amount that is not on the list and not what the order adds up to', () => {
    expect(unlistedAmounts(profile, 'I can do the agbada for ₦40,000', order)).toEqual([40000]);
  });

  it('flags every amount when no order has been recorded and the figure is not listed', () => {
    expect(unlistedAmounts(profile, 'Two agbada are ₦90,000')).toEqual([90000]);
  });
});

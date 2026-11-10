import { runHypaTool, ToolFailure } from '@hypa/intelligence-core';
import { businessProfileSchema } from './bridge.profile';
import { bridgeTools } from './bridge.tools';

const profile = businessProfileSchema.parse({
  name: 'Mama Ade Tailors',
  currency: 'NGN',
  priceList: [{ name: 'Agbada', price: 45000 }, { name: 'Cap', price: 5000 }],
});

const usdProfile = businessProfileSchema.parse({ ...profile, currency: 'USD', languages: ['English'], priceList: [{ name: 'Agbada', price: 45 }, { name: 'Cap', price: 5.5 }] });

const setup = (options: { profile?: typeof profile; open?: string } = {}) => {
  const saved: unknown[] = [];
  const asked: string[] = [];
  const linked: string[] = [];
  const tools = bridgeTools({
    profile: options.profile ?? profile,
    customer: { name: 'Ada', contact: 'whatsapp:abc' },
    saveOrder: async (order) => void saved.push(order),
    openOrderId: async () => options.open,
    linkOrder: async (orderId) => void linked.push(orderId),
    askOwner: async (reason) => void asked.push(reason),
  });
  const tool = (name: string) => tools.find((entry) => entry.name === name)!;
  return { saved, asked, linked, tool };
};
const executor = {} as never;
const paying = () => ({ createOrder: jest.fn().mockResolvedValue({ orderId: 'order-1', amount: '95.50', currency: 'USD', status: 'draft', approvalUrl: 'https://hypa.test/approve' }) }) as never as { createOrder: jest.Mock };

describe('create_order', () => {
  it('saves the order and returns the total and what is still missing, without asking the owner to approve yet', async () => {
    const { saved, tool } = setup();
    const result = await runHypaTool(
      tool('create_order'),
      executor,
      { items: [{ name: 'Agbada', qty: '2', size: 'L', color: 'blue', unitPrice: '45000' }, { name: 'Agbada', qty: 1, color: 'white' }], dueDate: 'Saturday', missing: ['size of the white agbada'] },
    );
    expect(result).toEqual({ saved: true, total: 135000, currency: 'NGN', missing: ['size of the white agbada'], status: 'collecting' });
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ dueDate: 'Saturday', notes: '', items: [{ qty: 2, unitPrice: 45000 }, { qty: 1 }] });
  });

  it('fails the step, and saves nothing, when a price differs from the price list', async () => {
    const { saved, tool } = setup();
    await expect(
      runHypaTool(tool('create_order'), executor, { items: [{ name: 'Agbada', qty: 2, unitPrice: 30000 }] }),
    ).rejects.toThrow(ToolFailure);
    await expect(
      runHypaTool(tool('create_order'), executor, { items: [{ name: 'Agbada', qty: 2, unitPrice: 30000 }] }),
    ).rejects.toThrow('45000');
    expect(saved).toEqual([]);
  });

  it('rejects an empty order', async () => {
    const { tool } = setup();
    await expect(runHypaTool(tool('create_order'), executor, { items: [] })).rejects.toThrow();
  });

  it('sends a complete order to the owner with the price list total, not an amount the model chose', async () => {
    const { tool, linked } = setup({ profile: usdProfile });
    const paid = paying();
    const result = await runHypaTool(tool('create_order'), paid as never, { items: [{ name: 'Agbada', qty: 2 }, { name: 'Cap', qty: 1 }], customerLanguage: 'Yoruba' });
    expect(result).toEqual({ saved: true, total: 95.5, currency: 'USD', missing: [], status: 'awaiting_owner_approval', orderId: 'order-1' });
    expect(paid.createOrder).toHaveBeenCalledWith({
      customerName: 'Ada',
      customerContact: 'whatsapp:abc',
      customerLanguage: 'yo',
      amount: '95.50',
      currency: 'USD',
      items: [{ name: 'Agbada', qty: 2, unitPrice: '45' }, { name: 'Cap', qty: 1, unitPrice: '5.5' }],
      merchantLanguage: 'en',
    });
    expect(linked).toEqual(['order-1']);
  });

  it('ignores a customer language it does not know instead of failing the order', async () => {
    const { tool } = setup({ profile: usdProfile });
    const paid = paying();
    await runHypaTool(tool('create_order'), paid as never, { items: [{ name: 'Cap', qty: 1 }], customerLanguage: 'Klingon' });
    expect(paid.createOrder.mock.calls[0][0].customerLanguage).toBeUndefined();
  });

  it('makes no second order while one is waiting for the owner', async () => {
    const { tool, linked } = setup({ profile: usdProfile, open: 'order-0' });
    const paid = paying();
    const result = await runHypaTool(tool('create_order'), paid as never, { items: [{ name: 'Cap', qty: 2 }] });
    expect(result).toMatchObject({ status: 'awaiting_owner_approval', orderId: 'order-0' });
    expect(paid.createOrder).not.toHaveBeenCalled();
    expect(linked).toEqual([]);
  });

  it('leaves payment to the owner when PayPal cannot take the business currency', async () => {
    const { tool, asked } = setup();
    const paid = paying();
    const result = await runHypaTool(tool('create_order'), paid as never, { items: [{ name: 'Cap', qty: 1 }] });
    expect(result).toMatchObject({ status: 'owner_arranges_payment', message: expect.stringContaining('PayPal does not support NGN') });
    expect(paid.createOrder).not.toHaveBeenCalled();
    expect(asked).toEqual([expect.stringContaining('PayPal does not support NGN')]);
  });
});

describe('ask_owner', () => {
  it('hands the chat to the owner with the reason', async () => {
    const { asked, tool } = setup();
    await expect(runHypaTool(tool('ask_owner'), executor, { reason: 'Wants a discount' })).resolves.toEqual({ ok: true });
    expect(asked).toEqual(['Wants a discount']);
  });
});


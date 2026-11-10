import { runHypaTool, ToolFailure } from '@hypa/intelligence-core';
import { businessProfileSchema } from './bridge.profile';
import { bridgeTools } from './bridge.tools';

const profile = businessProfileSchema.parse({
  name: 'Mama Ade Tailors',
  currency: 'NGN',
  priceList: [{ name: 'Agbada', price: 45000 }, { name: 'Cap', price: 5000 }],
});

const setup = () => {
  const saved: unknown[] = [];
  const asked: string[] = [];
  const tools = bridgeTools({
    profile,
    saveOrder: async (order) => void saved.push(order),
    askOwner: async (reason) => void asked.push(reason),
  });
  const tool = (name: string) => tools.find((entry) => entry.name === name)!;
  return { saved, asked, tool };
};
const executor = {} as never;

describe('record_order', () => {
  it('saves the order and returns the total and what is still missing', async () => {
    const { saved, tool } = setup();
    const result = await runHypaTool(
      tool('record_order'),
      executor,
      { items: [{ name: 'Agbada', qty: '2', size: 'L', color: 'blue', unitPrice: '45000' }, { name: 'Agbada', qty: 1, color: 'white' }], dueDate: 'Saturday', missing: ['size of the white agbada'] },
    );
    expect(result).toEqual({ saved: true, total: 135000, missing: ['size of the white agbada'] });
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ dueDate: 'Saturday', notes: '', items: [{ qty: 2, unitPrice: 45000 }, { qty: 1 }] });
  });

  it('fails the step, and saves nothing, when a price differs from the price list', async () => {
    const { saved, tool } = setup();
    await expect(
      runHypaTool(tool('record_order'), executor, { items: [{ name: 'Agbada', qty: 2, unitPrice: 30000 }] }),
    ).rejects.toThrow(ToolFailure);
    await expect(
      runHypaTool(tool('record_order'), executor, { items: [{ name: 'Agbada', qty: 2, unitPrice: 30000 }] }),
    ).rejects.toThrow('45000');
    expect(saved).toEqual([]);
  });

  it('rejects an empty order', async () => {
    const { tool } = setup();
    await expect(runHypaTool(tool('record_order'), executor, { items: [] })).rejects.toThrow();
  });
});

describe('ask_owner', () => {
  it('hands the chat to the owner with the reason', async () => {
    const { asked, tool } = setup();
    await expect(runHypaTool(tool('ask_owner'), executor, { reason: 'Wants a discount' })).resolves.toEqual({ ok: true });
    expect(asked).toEqual(['Wants a discount']);
  });
});


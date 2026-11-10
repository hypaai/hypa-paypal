import { z } from 'zod';
import { ToolFailure, type HypaTool } from '@hypa/intelligence-core';
import { orderPriceProblems, orderTotal, type BusinessProfile } from './bridge.profile';

const orderLine = z.object({
  name: z.string().trim().min(1).max(120).describe('The item, as named on the price list when it is there.'),
  qty: z.coerce.number().int().min(1).max(10_000),
  size: z.string().trim().max(40).optional(),
  color: z.string().trim().max(40).optional(),
  unitPrice: z.coerce
    .number()
    .nonnegative()
    .optional()
    .describe('Price of one, copied from the price list. Leave it out when the item is not on the list.'),
});

export const recordedOrderSchema = z.object({
  items: z.array(orderLine).min(1).max(50),
  dueDate: z.string().trim().max(60).optional().describe('When the customer wants it, as they said it.'),
  notes: z.string().trim().max(1000).default('').describe('Anything else about the order.'),
  missing: z.array(z.string().trim().max(120)).max(20).default([]).describe('Details still needed from the customer that this kind of item needs, such as a size for clothes.'),
});

export type RecordedOrder = z.infer<typeof recordedOrderSchema>;

/** Tools only the WhatsApp bridge agent has. They are not on the shared list, so `/v2/mcp` never offers them. */
export function bridgeTools(context: {
  profile: BusinessProfile;
  saveOrder: (order: RecordedOrder) => Promise<void>;
  askOwner: (reason: string) => Promise<void>;
}): HypaTool[] {
  return [
    {
      name: 'record_order',
      title: 'Record the order',
      description:
        "Save the customer's order as you understand it so far: items, quantities, when they want it, and sizes or colours only where the item has them. Call it every time the order changes. " +
        'Prices must be the ones on the price list; a different price is refused. List what you still need from the customer in missing.',
      inputSchema: recordedOrderSchema,
      outputSchema: z.object({ saved: z.boolean(), total: z.number().optional(), missing: z.array(z.string()) }),
      run: async (_executor, args) => {
        const order = args as RecordedOrder;
        const problems = orderPriceProblems(context.profile, order.items);
        if (problems.length) throw new ToolFailure(problems.join(' '), 'order');
        await context.saveOrder(order);
        const total = orderTotal(context.profile, order.items);
        return { saved: true, ...(total === undefined ? {} : { total }), missing: order.missing };
      },
    },
    {
      name: 'ask_owner',
      title: 'Hand over to the owner',
      description:
        'Pass the chat to the business owner. Use it for anything the profile cannot answer, and for discounts, complaints, refunds and special requests. Your reply should tell the customer the owner will answer.',
      inputSchema: z.object({ reason: z.string().trim().min(1).max(300).describe('Why, in a few words, for the owner.') }),
      outputSchema: z.object({ ok: z.boolean() }),
      run: async (_executor, args) => {
        await context.askOwner(String(args.reason));
        return { ok: true };
      },
    },
  ];
}

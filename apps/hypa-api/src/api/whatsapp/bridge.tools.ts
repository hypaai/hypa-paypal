import { z } from 'zod';
import { payments } from '@hypa/config/payments';
import { HYPA_TOOLS, resolveLanguage, runHypaTool, ToolFailure, type HypaTool } from '@hypa/intelligence-core';
import { orderLinePrice, orderPriceProblems, orderTotal, type BusinessProfile } from './bridge.profile';

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
  customerLanguage: z.string().trim().max(60).optional().describe('The language the customer writes in, such as Yoruba, Pidgin or French. Leave it out if you are not sure.'),
});

export type RecordedOrder = z.infer<typeof recordedOrderSchema>;

/** Tools only the WhatsApp bridge agent has. They are not on the shared list, so `/v2/mcp` never offers them. */
export function bridgeTools(context: {
  profile: BusinessProfile;
  customer: { name: string; contact: string };
  saveOrder: (order: RecordedOrder) => Promise<void>;
  /** The payable order this chat still has waiting for the owner, if any. */
  openOrder: () => Promise<{ id: string; amount: string; items: unknown } | undefined>;
  cancelOrder: (orderId: string) => Promise<void>;
  linkOrder: (orderId: string) => Promise<void>;
  askOwner: (reason: string) => Promise<void>;
}): HypaTool[] {
  return [
    {
      name: 'create_order',
      title: 'Create the order',
      description:
        "Save the customer's order as you understand it so far: items, quantities, when they want it, and sizes or colours only where the item has them. Call it every time the order changes. " +
        'Prices must be the ones on the price list; a different price is refused. List what you still need from the customer in missing. ' +
        'Once nothing is missing and every item has a listed price, it also sends the order to the owner to approve, and the result says so. ' +
        'Then tell the customer, in their language, that the business is confirming the order and they will get a payment link here once it is confirmed. Never ask for payment yourself.',
      inputSchema: recordedOrderSchema,
      outputSchema: z.object({
        saved: z.boolean(),
        total: z.number().optional(),
        currency: z.string(),
        missing: z.array(z.string()),
        status: z.enum(['collecting', 'awaiting_owner_approval', 'owner_arranges_payment']),
        orderId: z.string().optional(),
        message: z.string().optional(),
      }),
      run: async (executor, args) => {
        const order = args as RecordedOrder;
        const problems = orderPriceProblems(context.profile, order.items);
        if (problems.length) throw new ToolFailure(problems.join(' '), 'order');
        await context.saveOrder(order);
        const total = orderTotal(context.profile, order.items);
        const saved = { saved: true, ...(total === undefined ? {} : { total }), currency: context.profile.currency.toUpperCase(), missing: order.missing };
        if (order.missing.length || total === undefined) return { ...saved, status: 'collecting' as const };

        const currency = context.profile.currency.toUpperCase();
        if (!payments.methods.paypal.currencies.includes(currency)) {
          const message = `PayPal does not support ${currency}, so this order cannot be paid in chat. The owner arranges payment with the customer.`;
          await context.askOwner(message);
          return { ...saved, status: 'owner_arranges_payment' as const, message };
        }
        const lines = order.items.map((item) => ({ name: item.name, qty: item.qty, unitPrice: String(orderLinePrice(context.profile, item)) }));
        // An unchanged order keeps its place with the owner. A changed one replaces it, so the owner never approves a total the customer was not quoted.
        const waiting = await context.openOrder();
        if (waiting) {
          const same = Number(waiting.amount) === Number(total.toFixed(2)) && JSON.stringify(waiting.items) === JSON.stringify(lines);
          if (same) return { ...saved, status: 'awaiting_owner_approval' as const, orderId: waiting.id };
          await context.cancelOrder(waiting.id);
        }

        // The shared `paypal` tool's create_order, so the order is made the same way as in Chat; the bridge only adds the price-list total.
        const paypal = HYPA_TOOLS.find((tool) => tool.name === 'paypal')!;
        const created = (await runHypaTool(paypal, executor, {
          action: 'create_order',
          customerName: context.customer.name,
          customerContact: context.customer.contact,
          customerLanguage: order.customerLanguage ? resolveLanguage(order.customerLanguage)?.code : undefined,
          amount: total.toFixed(2),
          currency,
          items: lines,
          merchantLanguage: resolveLanguage(context.profile.languages[0] ?? '')?.code,
        })) as { orderId: string };
        await context.linkOrder(created.orderId);
        return { ...saved, status: 'awaiting_owner_approval' as const, orderId: created.orderId };
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

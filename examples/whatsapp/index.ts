import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { PayPalProvider } from '../../packages/@hypa-paypal-agent/src/index.js';

/**
 * A WhatsApp order that ends in a paid PayPal sandbox order.
 *   customer: "order 24.00 USD 2 coffee"  -> told the business is confirming
 *   merchant: POST /approve/<orderId>     -> customer gets the PayPal link
 *   PayPal webhook marks it paid          -> customer gets a receipt
 * Nothing payable is sent before the merchant approves. State is in memory; nothing is stored.
 */
const env = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set (see .env.example)`);
  return value;
};

if (process.env.PAYPAL_ENVIRONMENT !== 'sandbox') throw new Error('This example only runs against the PayPal sandbox. Set PAYPAL_ENVIRONMENT=sandbox.');

const paypal = new PayPalProvider({ clientId: env('PAYPAL_CLIENT_ID'), clientSecret: env('PAYPAL_CLIENT_SECRET'), webhookId: env('PAYPAL_WEBHOOK_ID'), environment: 'sandbox' });
const graph = `https://graph.facebook.com/${process.env.WHATSAPP_GRAPH_VERSION || 'v23.0'}/${env('WHATSAPP_PHONE_NUMBER_ID')}/messages`;
const publicUrl = env('PUBLIC_URL').replace(/\/$/, '');

type Order = { id: string; to: string; amount: string; currency: string; item: string; status: 'draft' | 'approved' | 'paid'; providerRef?: string; receiptSent?: boolean };
const orders = new Map<string, Order>();
const seen = new Set<string>(); // WhatsApp message ids and PayPal event ids already handled

async function send(to: string, body: string) {
  const response = await fetch(graph, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('WHATSAPP_ACCESS_TOKEN')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
  });
  if (!response.ok) throw new Error(`WhatsApp answered ${response.status}`);
}

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

async function onMessage(message: { id: string; from: string; text?: { body: string } }) {
  if (seen.has(message.id)) return; // a retried delivery makes no second order
  seen.add(message.id);
  const match = message.text?.body.match(/^order\s+(\d+(?:\.\d{1,2})?)\s+([A-Za-z]{3})\s+(.+)$/i);
  if (!match) return send(message.from, 'Send: order <amount> <currency> <item>, for example: order 24.00 USD 2 coffee');
  const order: Order = { id: randomUUID(), to: message.from, amount: match[1], currency: match[2].toUpperCase(), item: match[3], status: 'draft' };
  orders.set(order.id, order);
  console.log(`Order ${order.id} waits for approval: POST ${publicUrl}/approve/${order.id}`);
  await send(order.to, 'Your order is being confirmed. You will get a payment link here once the business confirms it.');
}

async function approve(order: Order) {
  if (order.status !== 'draft') return; // approving twice sends one link
  order.status = 'approved';
  const checkout = await paypal.createCheckout({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    items: [{ name: order.item, qty: 1, unitPrice: order.amount }],
    returnUrl: `${publicUrl}/paid`,
    cancelUrl: `${publicUrl}/cancelled`,
    idempotencyKey: `checkout-${order.id}`,
  });
  order.providerRef = checkout.providerRef;
  await send(order.to, `Your order is confirmed. Pay ${order.amount} ${order.currency} with PayPal:\n${checkout.checkoutUrl}`);
}

async function onPayPal(headers: Record<string, string>, raw: string) {
  const result = await paypal.verifyWebhook(headers, raw);
  if (!result.valid) return false;
  const event = result.event;
  if (!event || seen.has(event.eventId)) return true;
  seen.add(event.eventId);
  const order = [...orders.values()].find((entry) => entry.providerRef === event.providerRef);
  if (order && event.status === 'paid' && !order.receiptSent) {
    order.status = 'paid';
    order.receiptSent = true;
    await send(order.to, `Payment received: ${order.amount} ${order.currency}. Thank you!`);
  }
  return true;
}

const read = (request: IncomingMessage) => new Promise<string>((resolve) => {
  const chunks: Buffer[] = [];
  request.on('data', (chunk: Buffer) => chunks.push(chunk));
  request.on('end', () => resolve(Buffer.concat(chunks).toString()));
});
const reply = (response: ServerResponse, status: number, body = '') => response.writeHead(status).end(body);

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', publicUrl);
    if (request.method === 'GET' && url.pathname === '/whatsapp') {
      const ok = url.searchParams.get('hub.verify_token') === env('WHATSAPP_VERIFY_TOKEN');
      return ok ? reply(response, 200, url.searchParams.get('hub.challenge') ?? '') : reply(response, 403);
    }
    const raw = await read(request);
    if (request.method === 'POST' && url.pathname === '/whatsapp') {
      const expected = `sha256=${createHmac('sha256', env('WHATSAPP_APP_SECRET')).update(raw).digest('hex')}`;
      if (!same(String(request.headers['x-hub-signature-256'] ?? ''), expected)) return reply(response, 403);
      const messages = JSON.parse(raw).entry?.flatMap((entry: any) => entry.changes?.flatMap((change: any) => change.value?.messages ?? []) ?? []) ?? [];
      reply(response, 200); // answer Meta at once, then work
      for (const message of messages) await onMessage(message).catch((error) => console.error(error.message));
      return;
    }
    if (request.method === 'POST' && url.pathname === '/paypal') {
      const headers = Object.fromEntries(Object.entries(request.headers).map(([key, value]) => [key, String(value)]));
      return reply(response, (await onPayPal(headers, raw)) ? 200 : 400);
    }
    const approval = url.pathname.match(/^\/approve\/([\w-]+)$/);
    if (request.method === 'POST' && approval) {
      if (!same(String(request.headers.authorization ?? ''), `Bearer ${env('MERCHANT_TOKEN')}`)) return reply(response, 401);
      const order = orders.get(approval[1]);
      if (!order) return reply(response, 404);
      await approve(order);
      return reply(response, 200, order.status);
    }
    reply(response, 404);
  } catch (error) {
    console.error((error as Error).message);
    if (!response.headersSent) reply(response, 500);
  }
}).listen(Number(process.env.PORT) || 3000, () => console.log('WhatsApp + PayPal sandbox example is listening'));

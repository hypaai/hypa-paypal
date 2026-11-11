import { API_URL } from '@/api';
import { createPaymentLink } from '@hypa/intelligence-core/payment-link';
import type { PaymentApproval } from '@hypa/intelligence-core/agent-stream';

export type CommerceOrder = PaymentApproval & {
  status: 'draft' | 'approved' | 'paid' | 'failed' | 'cancelled';
};

async function request<T>(token: string, path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    let message = 'Could not load this order.';
    try {
      const body = await response.json() as { message?: unknown };
      if (typeof body.message === 'string') message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(', ');
    } catch { /* Keep the generic message for an unreadable error body. */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export const getCommerceOrder = (token: string, orderId: string) =>
  request<CommerceOrder>(token, `/commerce/orders/${encodeURIComponent(orderId)}/approval`);

/** `reviewed` is the amount and currency the merchant was looking at; the server refuses a changed order. */
export const approveCommerceOrder = async (
  token: string,
  orderId: string,
  reviewed: { amount: string; currency: string },
) => {
  await request<unknown>(token, `/commerce/orders/${encodeURIComponent(orderId)}/approve`, 'POST', reviewed);
  return getCommerceOrder(token, orderId);
};

export const cancelCommerceOrder = async (token: string, orderId: string) => {
  await request<unknown>(token, `/commerce/orders/${encodeURIComponent(orderId)}/cancel`, 'POST');
  return getCommerceOrder(token, orderId);
};

export const createCommercePaymentLink = (token: string, orderId: string) =>
  createPaymentLink({ baseUrl: API_URL, token, orderId });

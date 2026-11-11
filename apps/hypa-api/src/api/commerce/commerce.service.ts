import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { resolveLanguage } from '@hypa/intelligence-core';
import { PayPalProvider } from '@hypa/paypal-agent';
import { payments } from '@hypa/config/payments';
import { DbService } from 'src/libs/db/db.service';
import { PayPalWebhookService } from '../webhooks/paypal-webhook.service';
import type {
  CreateCommerceCustomerInput,
  CreateCommerceOrderInput,
  UpdateCommerceOrderInput,
} from './commerce.dto';

type OrderItem = { name: string; qty: number; unitPrice: string };

const orderItems = (items: unknown) => (Array.isArray(items) ? (items as OrderItem[]) : []);

const matchesItemTotal = (items: OrderItem[], amount: string) =>
  items
    .reduce((total, item) => total.add(new Prisma.Decimal(item.unitPrice).mul(item.qty)), new Prisma.Decimal(0))
    .equals(new Prisma.Decimal(amount));

@Injectable()
export class CommerceService {
  private provider?: PayPalProvider;
  constructor(
    private readonly db: DbService,
    private readonly settlement: PayPalWebhookService,
  ) {}

  /** The published PayPal adapter, built on first use so tests can stub fetch. */
  private paypal() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new BadRequestException('PayPal credentials are not configured');
    this.provider ??= new PayPalProvider({
      clientId,
      clientSecret,
      environment: process.env.PAYPAL_ENVIRONMENT === 'live' ? 'live' : 'sandbox',
    });
    return this.provider;
  }

  async createCustomer(merchantId: string, input: CreateCommerceCustomerInput) {
    const language = this.resolveCatalogLanguage(input.language);
    return this.db.commerce_customer.upsert({
      where: { merchantId_contact: { merchantId, contact: input.contact } },
      create: { merchantId, name: input.name, contact: input.contact, language },
      update: { name: input.name, ...(language ? { language } : {}) },
    });
  }

  async createOrder(merchantId: string, input: CreateCommerceOrderInput) {
    const customerLanguage = this.resolveCatalogLanguage(input.customer.language);
    const merchantLanguage = this.resolveCatalogLanguage(input.merchantLanguage);
    if (!matchesItemTotal(input.items, input.amount)) {
      throw new BadRequestException('Proposed amount must match the order item total');
    }
    if (input.agentRequestId) {
      const existing = await this.findByAgentRequest(merchantId, input.agentRequestId);
      if (existing) return existing;
    }
    try {
      return await this.db.$transaction(async (tx) => {
        const customer = await tx.commerce_customer.upsert({
          where: {
            merchantId_contact: {
              merchantId,
              contact: input.customer.contact,
            },
          },
          create: {
            merchantId,
            name: input.customer.name,
            contact: input.customer.contact,
            language: customerLanguage,
          },
          update: {
            name: input.customer.name,
            ...(customerLanguage ? { language: customerLanguage } : {}),
          },
        });
        const order = await tx.commerce_order.create({
          data: {
            merchantId,
            customerId: customer.id,
            items: input.items,
            amount: new Prisma.Decimal(input.amount),
            currency: input.currency,
            merchant_language: merchantLanguage,
            source: input.source ?? 'text',
            surface: input.surface ?? 'app',
            agent_request_id: input.agentRequestId,
          },
          include: { customer: true },
        });
        await tx.commerce_payment_event.create({
          data: {
            event_id: `order.created:${order.id}`,
            orderId: order.id,
            event_type: 'order.created',
            status: order.status,
            payload: { amount: input.amount, currency: input.currency },
          },
        });
        return order;
      });
    } catch (error) {
      // Another retry may have won the unique (merchant, requestId) insert.
      if (input.agentRequestId && (error as { code?: string } | null)?.code === 'P2002') {
        const existing = await this.findByAgentRequest(merchantId, input.agentRequestId);
        if (existing) return existing;
      }
      throw error;
    }
  }

  async getOrder(merchantId: string, orderId: string) {
    const order = await this.db.commerce_order.findFirst({
      where: { id: orderId, merchantId },
      include: {
        customer: true,
        payments: { orderBy: { created_at: 'desc' } },
        events: { orderBy: { created_at: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getOrderApproval(merchantId: string, orderId: string) {
    const order = await this.db.commerce_order.findFirst({
      where: { id: orderId, merchantId },
      include: { customer: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return {
      orderId: order.id,
      amount: order.amount.toString(),
      currency: order.currency,
      fee: this.getPaidOrderFee(),
      customer: { name: order.customer.name, contact: order.customer.contact, language: order.customer.language },
      items: orderItems(order.items),
      merchantLanguage: order.merchant_language ?? 'en',
      status: order.status,
    };
  }

  /**
   * The customer's own view after PayPal. They have no Hypa account, so a
   * random receipt capability in the return URL authorizes this limited view.
   * Checking also settles the payment if PayPal has completed it.
   */
  async getReceipt(orderId: string, receiptToken: string) {
    const paymentRecord = await this.db.commerce_payment.findFirst({
      where: {
        orderId,
        provider: 'paypal',
        receipt_token: receiptToken,
        receipt_token_expires_at: { gt: new Date() },
      },
      select: {
        id: true,
        provider_ref: true,
        status: true,
        order: { select: { status: true } },
      },
    });
    if (!paymentRecord) throw new NotFoundException('Order not found');
    const order = await this.db.commerce_order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        merchant: { select: { first_name: true, last_name: true } },
        payments: { where: { id: paymentRecord.id }, take: 1 },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    const payment = order.payments[0];
    const merchant = [order.merchant?.first_name, order.merchant?.last_name]
      .filter(Boolean)
      .join(' ');

    return {
      status: order.status,
      paymentStatus: payment?.status ?? null,
      amount: order.amount.toString(),
      currency: order.currency,
      language: order.customer.language ?? order.merchant_language ?? 'en',
      reference: paymentRecord.provider_ref,
      merchant: merchant || null,
      paidAt: payment?.status === 'paid' ? payment.updated_at.toISOString() : null,
    };
  }

  async reconcileReceipt(orderId: string, receiptToken: string) {
    const payment = await this.db.commerce_payment.findFirst({
      where: {
        orderId,
        provider: 'paypal',
        receipt_token: receiptToken,
        receipt_token_expires_at: { gt: new Date() },
      },
      select: {
        provider_ref: true,
        status: true,
        order: { select: { status: true } },
      },
    });
    if (!payment) throw new NotFoundException('Order not found');
    if (
      payment.provider_ref &&
      payment.status === 'pending' &&
      payment.order.status === 'approved'
    ) {
      await this.settlement.reconcile(payment.provider_ref);
    }
    return { received: true };
  }

  getApprovalUrl(orderId: string) {
    const base = process.env.LAB_FRONTEND_URL || process.env.FRONTEND_URL;
    if (!base) throw new BadRequestException('Approval link is not configured');
    let url: URL;
    try {
      url = new URL(`/orders/${encodeURIComponent(orderId)}/approve`, base);
    } catch {
      throw new BadRequestException('Approval link is not configured');
    }
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
      throw new BadRequestException('Approval link must use HTTPS');
    }
    return url.toString();
  }

  async getPaymentStatus(merchantId: string, orderId: string) {
    const order = await this.db.commerce_order.findFirst({
      where: { id: orderId, merchantId },
      include: { payments: { orderBy: { created_at: 'desc' }, take: 1 } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return {
      orderId: order.id,
      orderStatus: order.status,
      paymentStatus: order.payments[0]?.status ?? null,
    };
  }

  async updateOrder(merchantId: string, orderId: string, input: UpdateCommerceOrderInput) {
    if (!matchesItemTotal(input.items, input.amount)) {
      throw new BadRequestException('Order amount must match the order item total');
    }
    return this.db.$transaction(async (tx) => {
      const order = await tx.commerce_order.findFirst({ where: { id: orderId, merchantId } });
      if (!order) throw new NotFoundException('Order not found');
      if (order.status !== 'draft' && order.status !== 'approved') {
        throw new BadRequestException('Only draft or approved orders can be changed');
      }
      const nextStatus = order.status === 'approved' ? 'draft' : order.status;
      const changed = await tx.commerce_order.updateMany({
        where: { id: order.id, status: order.status },
        data: { amount: new Prisma.Decimal(input.amount), items: input.items, status: nextStatus },
      });
      if (changed.count !== 1) throw new BadRequestException('Order status changed concurrently');
      const updated = await tx.commerce_order.findUniqueOrThrow({ where: { id: order.id }, include: { customer: true } });
      await tx.commerce_payment_event.create({
        data: {
          event_id: `order.updated:${order.id}:${randomUUID()}`,
          orderId: order.id,
          event_type: order.status === 'approved' ? 'order.status_changed' : 'order.updated',
          status: nextStatus,
          payload: { from: order.status, to: nextStatus, amount: input.amount },
        },
      });
      return updated;
    });
  }

  async createCheckout(merchantId: string, orderId: string) {
    const order = await this.db.commerce_order.findFirst({
      where: { id: orderId, merchantId },
      include: { customer: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'approved') {
      throw new BadRequestException('Only approved orders can start checkout');
    }
    if (!payments.methods.paypal.currencies.includes(order.currency)) {
      throw new BadRequestException(`PayPal does not support ${order.currency}`);
    }
    const items = orderItems(order.items);
    const idempotencyKey = `cm-${createHash('sha256').update(JSON.stringify({
      orderId: order.id,
      amount: order.amount.toString(),
      currency: order.currency,
      items,
    })).digest('hex').slice(0, 32)}`;
    const existing = await this.db.commerce_payment.findUnique({
      where: { idempotency_key: idempotencyKey },
    });
    const receiptTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (existing?.checkout_url && existing.provider_ref) {
      // Only a payment still waiting on the customer keeps its receipt link alive.
      if (existing.status === 'pending') {
        await this.db.commerce_payment.update({
          where: { id: existing.id },
          data: { receipt_token_expires_at: receiptTokenExpiresAt },
        });
      }
      return {
        orderId: order.id,
        checkoutUrl: existing.checkout_url,
        amount: order.amount.toString(),
        currency: order.currency,
        customerLanguage: order.customer.language,
        merchantLanguage: order.merchant_language,
      };
    }

    const frontendUrl = process.env.LAB_FRONTEND_URL || process.env.FRONTEND_URL;
    if (!frontendUrl) throw new BadRequestException('Checkout return URL is not configured');
    await this.cancelAbandonedPayments(order.id, idempotencyKey);
    let payment = existing;
    if (!payment) {
      payment = await this.db.commerce_payment.upsert({
        where: { idempotency_key: idempotencyKey },
        create: {
          orderId: order.id,
          provider: 'paypal',
          receipt_token: randomBytes(32).toString('base64url'),
          receipt_token_expires_at: receiptTokenExpiresAt,
          idempotency_key: idempotencyKey,
          amount: order.amount,
          currency: order.currency,
        },
        update: {},
      });
    } else {
      // A payment closed as superseded has no link and no money, so the same order version
      // (for example edited back) reopens it instead of being stuck behind it.
      payment = await this.db.commerce_payment.update({
        where: { id: payment.id },
        data: {
          receipt_token_expires_at: receiptTokenExpiresAt,
          ...(payment.status === 'cancelled' ? { status: 'pending' } : {}),
        },
      });
    }
    let checkout: { providerRef: string; checkoutUrl: string };
    try {
      checkout = await this.paypal().createCheckout({
        orderId: order.id,
        amount: order.amount.toString(),
        currency: order.currency,
        items,
        // PayPal's page only has some languages; without one it uses its own default.
        locale: (payments.methods.paypal.locales as Record<string, string>)[order.customer.language ?? ''],
        returnUrl: `${frontendUrl}/pay/${encodeURIComponent(order.id)}?receipt=${encodeURIComponent(payment.receipt_token)}`,
        cancelUrl: `${frontendUrl}/pay/${encodeURIComponent(order.id)}?checkout=cancel`,
        idempotencyKey,
      });
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'PayPal checkout creation failed');
    }
    if (!this.isPayPalUrl(checkout.checkoutUrl)) {
      throw new BadRequestException('PayPal did not return a valid approval URL');
    }
    const checkoutUrl = checkout.checkoutUrl;
    // The link and its audit entry are saved together or not at all. A payment that a newer
    // checkout cancelled meanwhile never gets a link.
    await this.db.$transaction(async (tx) => {
      const saved = await tx.commerce_payment.updateMany({
        where: { id: payment.id, status: 'pending' },
        data: { provider_ref: checkout.providerRef, checkout_url: checkoutUrl },
      });
      if (saved.count !== 1) {
        throw new BadRequestException('This checkout was replaced by a newer one; start checkout again');
      }
      await tx.commerce_payment_event.create({
        data: {
          event_id: `payment.checkout:${payment.id}`,
          orderId: order.id,
          paymentId: payment.id,
          event_type: 'payment.checkout_created',
          status: 'pending',
          payload: { provider: 'paypal', providerRef: checkout.providerRef },
        },
      });
    });
    return {
      orderId: order.id,
      checkoutUrl,
      amount: order.amount.toString(),
      currency: order.currency,
      customerLanguage: order.customer.language,
      merchantLanguage: order.merchant_language,
    };
  }

  /**
   * Payments of this order that never got a checkout link (their PayPal call failed)
   * and belong to an older version of the order are closed instead of left pending.
   */
  private async cancelAbandonedPayments(orderId: string, currentKey: string) {
    const stale = await this.db.commerce_payment.findMany({
      where: { orderId, status: 'pending', checkout_url: null, idempotency_key: { not: currentKey } },
      select: { id: true },
    });
    if (!stale.length) return;
    await this.db.$transaction([
      this.db.commerce_payment.updateMany({
        where: { id: { in: stale.map(({ id }) => id) }, status: 'pending' },
        data: { status: 'cancelled' },
      }),
      this.db.commerce_payment_event.createMany({
        data: stale.map(({ id }) => ({
          event_id: `payment.cancelled:${id}:${randomUUID()}`,
          orderId,
          paymentId: id,
          event_type: 'payment.cancelled',
          status: 'cancelled',
          payload: { reason: 'superseded' },
        })),
      }),
    ]);
  }

  async listCustomers(merchantId: string) {
    return this.db.commerce_customer.findMany({
      where: { merchantId },
      orderBy: { updated_at: 'desc' },
    });
  }

  async updateOrderStatus(
    merchantId: string,
    orderId: string,
    next: 'approved' | 'cancelled',
    reviewed?: { amount: string; currency: string },
  ) {
    return this.db.$transaction(async (tx) => {
      const order = await tx.commerce_order.findFirst({
        where: { id: orderId, merchantId },
      });
      if (!order) throw new NotFoundException('Order not found');
      // Approving is the merchant agreeing to what they saw: if the order has changed since, the
      // approval is refused rather than applied to an amount they never reviewed.
      if (
        next === 'approved' &&
        (!reviewed ||
          !new Prisma.Decimal(reviewed.amount).equals(order.amount) ||
          reviewed.currency.toUpperCase() !== order.currency)
      ) {
        throw new BadRequestException('This order changed after you reviewed it. Open it again to review the new amount.');
      }
      const allowed =
        (order.status === 'draft' && ['approved', 'cancelled'].includes(next)) ||
        (order.status === 'approved' && next === 'cancelled');
      if (!allowed) throw new BadRequestException('Invalid order status transition');
      const changed = await tx.commerce_order.updateMany({
        where: { id: order.id, status: order.status },
        data: { status: next },
      });
      if (changed.count !== 1) throw new BadRequestException('Order status changed concurrently');
      const updated = await tx.commerce_order.findUniqueOrThrow({
        where: { id: order.id },
      });
      await tx.commerce_payment_event.create({
        data: {
          event_id: `order.status:${order.id}:${randomUUID()}`,
          orderId: order.id,
          event_type: 'order.status_changed',
          status: next,
          payload: { from: order.status, to: next },
        },
      });
      return updated;
    });
  }

  listPaymentMethods(country: string, currency: string) {
    const normalizedCountry = country.toUpperCase();
    const normalizedCurrency = currency.toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalizedCountry) || !/^[A-Z]{3}$/.test(normalizedCurrency)) {
      throw new BadRequestException('Country and currency must be ISO codes');
    }
    const paypal = payments.methods.paypal;
    const restricted = paypal.inCountryOnlyCurrencies.includes(normalizedCurrency);
    const allowedCountry = {
      BRL: 'BR',
      CNY: 'CN',
      MYR: 'MY',
    }[normalizedCurrency];
    if (
      !paypal.currencies.includes(normalizedCurrency) ||
      (restricted && normalizedCountry !== allowedCountry)
    ) {
      return { country: normalizedCountry, currency: normalizedCurrency, methods: [] };
    }
    return {
      country: normalizedCountry,
      currency: normalizedCurrency,
      methods: [{ id: 'paypal', name: 'PayPal' }],
    };
  }

  getPaidOrderFee() {
    return payments.paid_order;
  }

  private findByAgentRequest(merchantId: string, agentRequestId: string) {
    return this.db.commerce_order.findUnique({
      where: { merchantId_agent_request_id: { merchantId, agent_request_id: agentRequestId } },
      include: { customer: true },
    });
  }

  private resolveCatalogLanguage(value?: string) {
    if (!value) return null;
    const language = resolveLanguage(value);
    if (!language) throw new BadRequestException('Unknown catalog language');
    return language.code;
  }

  private isPayPalUrl(value: string) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && (url.hostname === 'paypal.com' || url.hostname.endsWith('.paypal.com'));
    } catch {
      return false;
    }
  }
}

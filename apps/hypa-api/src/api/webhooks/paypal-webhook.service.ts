import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { payments } from '@hypa/config/payments';
import { PayPalProvider } from '@hypa/paypal-agent';
import { DbService } from 'src/libs/db/db.service';
import { DeveloperSharedService } from '../developer/providers/shared.service';
import { PaymentNotifier } from './payment-notifier.service';
import { createHash } from 'node:crypto';
import { OrderEvents } from './order-events';


type PayPalStatus = 'pending' | 'paid' | 'failed';

@Injectable()
export class PayPalWebhookService {
  private provider?: PayPalProvider;

  constructor(
    private readonly db: DbService,
    private readonly shared: DeveloperSharedService,
    private readonly events: OrderEvents,
    @Optional() private readonly notifier?: PaymentNotifier,
  ) {}

  async handle(headers: Record<string, string | string[] | undefined>, rawBody: string | Buffer) {
    const event = await this.verify(headers, rawBody);
    if (!event.status) return { received: true, ignored: true };
    if (!event.payload) throw new BadRequestException('PayPal webhook payload is missing');
    return this.apply(
      { ...event, status: event.status },
      event.payload as Prisma.InputJsonValue,
    );
  }

  /**
   * Records what PayPal reports and moves the order with it. Reached from a
   * verified webhook and from a merchant's status check, so every write is
   * keyed by `event_id`: the same outcome arriving twice settles once.
   */
  private async apply(
    event: { eventId: string; providerRef: string; eventType: string; status: PayPalStatus },
    payload: Prisma.InputJsonValue,
  ) {
    const mapped = { providerRef: event.providerRef, status: event.status };

    try {
      const result = await this.db.$transaction(async (tx) => {
        const duplicate = await tx.commerce_payment_event.findUnique({
          where: { event_id: event.eventId },
        });
        if (duplicate) {
          if (event.eventType !== 'CHECKOUT.ORDER.APPROVED') {
            return { received: true, duplicate: true };
          }
          const existing = await tx.commerce_payment.findFirst({
            where: { provider: 'paypal', provider_ref: mapped.providerRef },
            include: { order: true },
          });
          return {
            received: true,
            duplicate: true,
            ...(existing?.order.status === 'approved' ? { captureOrderId: mapped.providerRef } : {}),
          };
        }

        const payment = await tx.commerce_payment.findFirst({
          where: { provider: 'paypal', provider_ref: mapped.providerRef },
          include: { order: true },
        });
        if (!payment) throw new NotFoundException('PayPal order not found');

        // Settled already (for example by a status check): a later webhook is a duplicate,
        // not an error PayPal should retry.
        if (mapped.status === 'paid' && payment.order.status === 'paid') {
          return { received: true, duplicate: true };
        }

        await tx.commerce_payment_event.create({
          data: {
            event_id: event.eventId,
            orderId: payment.orderId,
            paymentId: payment.id,
            event_type: event.eventType,
            status: mapped.status,
            payload,
          },
        });

        await tx.commerce_payment.update({
          where: { id: payment.id },
          data: { status: mapped.status },
        });
        if (mapped.status === 'pending') {
          return {
            received: true,
            status: mapped.status,
            // Never capture a link made for an older version of the order: PayPal would take
            // the buyer's money and the order would refuse to settle.
            ...(event.eventType === 'CHECKOUT.ORDER.APPROVED' &&
            payment.order.status === 'approved' &&
            this.matchesOrder(payment)
              ? { captureOrderId: mapped.providerRef }
              : {}),
          };
        }
        if (mapped.status === 'failed') {
          await tx.commerce_order.updateMany({
            where: { id: payment.orderId, status: { in: ['draft', 'approved'] } },
            data: { status: 'failed' },
          });
          return { received: true, status: mapped.status };
        }

        // PayPal already holds the buyer's money, so a payment that cannot settle this order
        // (an older link, or an order cancelled meanwhile) is recorded for a person to refund.
        // Throwing would roll the record back and make PayPal retry the webhook for days.
        const unsettled = !this.matchesOrder(payment)
          ? 'amount_mismatch'
          : payment.order.status !== 'approved'
            ? 'order_not_approved'
            : undefined;
        if (unsettled) {
          await tx.commerce_payment_event.create({
            data: {
              event_id: `payment.${unsettled}:${payment.id}`,
              orderId: payment.orderId,
              paymentId: payment.id,
              event_type: `payment.${unsettled}`,
              status: 'paid',
              payload: {
                paymentAmount: payment.amount.toString(),
                paymentCurrency: payment.currency,
                orderAmount: payment.order.amount.toString(),
                orderCurrency: payment.order.currency,
                orderStatus: payment.order.status,
              },
            },
          });
          Logger.error(`PayPal payment ${payment.id} cannot settle order ${payment.orderId}: ${unsettled}. Refund needed.`);
          return { received: true, status: 'unsettled', reason: unsettled };
        }
        const orderChanged = await tx.commerce_order.updateMany({
          where: { id: payment.orderId, status: 'approved' },
          data: { status: 'paid' },
        });
        if (orderChanged.count === 0) {
          throw new BadRequestException('PayPal payment completed for a commerce order that is no longer approved');
        }
        const paidEventId = `payment.paid:${payment.orderId}`;
        const alreadyEmitted = await tx.commerce_payment_event.findUnique({
          where: { event_id: paidEventId },
        });
        let warning: string | undefined;
        if (!alreadyEmitted) {
          const fee = payments.paid_order;
          const debit = await this.shared.debitCommerceFee(tx, {
            userId: payment.order.merchantId,
            orderId: payment.orderId,
            tool: 'payments.paid_order',
            amount: fee.amount,
            currency: fee.currency,
          });
          warning = debit.warning;
          await tx.commerce_payment_event.create({
            data: {
              event_id: paidEventId,
              orderId: payment.orderId,
              paymentId: payment.id,
              event_type: 'payment.paid',
              status: 'paid',
              payload: {
                orderId: payment.orderId,
                merchantId: payment.order.merchantId,
                amount: payment.order.amount.toString(),
                currency: payment.order.currency,
                agentRequestId: payment.order.agent_request_id,
                ...(warning ? { warning } : {}),
              },
            },
          });
        }
        return {
          received: true,
          status: 'paid',
          orderId: payment.orderId,
          merchantId: payment.order.merchantId,
          ...(warning ? { warning } : {}),
        };
      });
      if ('captureOrderId' in result && typeof result.captureOrderId === 'string') {
        await this.captureApprovedOrder(result.captureOrderId);
        return {
          received: true,
          status: 'pending',
          ...('duplicate' in result && result.duplicate ? { duplicate: true } : {}),
        };
      }
      if ('merchantId' in result && typeof result.merchantId === 'string') {
        try {
          await this.shared.invalidateUserBalanceCache(result.merchantId);
        } catch {
          Logger.warn('Commerce wallet balance cache invalidation failed');
        }
        if ('orderId' in result && typeof result.orderId === 'string') {
          await this.events.emit('paid', result.orderId);
          // Settled already, so a failure here is logged and never undoes or retries the payment.
          try {
            await this.notifier?.orderPaid(result.orderId);
          } catch (error) {
            Logger.warn(`Could not tell the merchant the order was paid: ${error instanceof Error ? error.message : 'unknown error'}`);
          }
        }
        return {
          received: true,
          status: 'paid',
          ...('warning' in result && result.warning ? { warning: result.warning } : {}),
        };
      }
      return result;
    } catch (error) {
      if ((error as { code?: string })?.code === 'P2002') {
        return { received: true, duplicate: true };
      }
      throw error;
    }
  }

  private matchesOrder(payment: {
    amount: Prisma.Decimal | string | number;
    currency: string;
    order: { amount: Prisma.Decimal | string | number; currency: string };
  }) {
    return (
      new Prisma.Decimal(payment.amount).equals(payment.order.amount) &&
      payment.currency === payment.order.currency
    );
  }

  private async verify(
    headers: Record<string, string | string[] | undefined>,
    rawBody: string | Buffer,
  ): Promise<{
    eventId: string;
    providerRef: string;
    eventType: string;
    status?: PayPalStatus;
    payload?: Record<string, unknown>;
  }> {
    const normalized = Object.fromEntries(
      Object.entries(headers).flatMap(([key, value]) => {
        const first = Array.isArray(value) ? value[0] : value;
        return typeof first === 'string' ? [[key.toLowerCase(), first] as [string, string]] : [];
      }),
    );
    const required = [
      'paypal-auth-algo',
      'paypal-cert-url',
      'paypal-transmission-id',
      'paypal-transmission-sig',
      'paypal-transmission-time',
    ];
    if (required.some((name) => !normalized[name])) {
      throw new BadRequestException('Missing PayPal transmission headers');
    }
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!clientId || !clientSecret || !webhookId) {
      throw new BadRequestException('PayPal webhook credentials are not configured');
    }
    const body = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
    const verified = await this.paypal(clientId, clientSecret, webhookId).verifyWebhook(normalized, body);
    if (!verified.valid) throw new BadRequestException('Invalid PayPal webhook signature');
    if (!verified.event) throw new BadRequestException('PayPal event is missing its id or order reference');
    return { ...verified.event, payload: verified.payload };
  }

  /** The published PayPal adapter, built on first use so tests can stub fetch. */
  private paypal(clientId: string, clientSecret: string, webhookId?: string) {
    this.provider ??= new PayPalProvider({
      clientId,
      clientSecret,
      webhookId: webhookId ?? process.env.PAYPAL_WEBHOOK_ID,
      environment: process.env.PAYPAL_ENVIRONMENT === 'live' ? 'live' : 'sandbox',
    });
    return this.provider;
  }

  /**
   * Finishes an order PayPal already holds as approved, for a merchant asking
   * where their money is. Capture is otherwise only reachable from a webhook,
   * so a delivery that never lands would strand a paid-for order forever.
   * Settling here uses the same idempotency key, so a late webhook is a
   * duplicate rather than a second charge.
   */
  async reconcile(providerRef: string): Promise<void> {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) return;
    const provider = this.paypal(clientId, clientSecret);
    let status = await provider.getStatus(providerRef);
    if (status === 'approved') {
      const payment = await this.db.commerce_payment.findFirst({
        where: { provider: 'paypal', provider_ref: providerRef },
        include: { order: true },
      });
      // Same rule as the webhook: an older link is never captured.
      if (!payment || !this.matchesOrder(payment)) return;
      const captureStatus = await this.capture(providerRef);
      if (captureStatus !== 'paid') return;
      status = 'paid';
    }
    if (status !== 'paid' && status !== 'failed') return;
    await this.apply(
      {
        eventId: `reconcile:${providerRef}:${status}`,
        providerRef,
        eventType: 'RECONCILE',
        status,
      },
      { providerRef, status, source: 'status-check' },
    );
  }

  private async capture(providerRef: string): Promise<PayPalStatus> {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new BadRequestException('PayPal credentials are not configured');
    const requestId = `cap-${createHash('sha256').update(providerRef).digest('hex').slice(0, 32)}`;
    const captured = await this.paypal(clientId, clientSecret).capture(providerRef, requestId);
    return captured.status;
  }

  private async captureApprovedOrder(orderId: string) {
    const status = await this.capture(orderId);
    if (status === 'pending') return;
    if (status !== 'paid') {
      throw new BadRequestException('PayPal capture failed');
    }
  }
}

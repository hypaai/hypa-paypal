import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { HYPA_TOOLS, runHypaTool } from '@hypa/intelligence-core';
import { receiptLabels } from '@hypa/intelligence-core/payment-receipt';
import { DbService } from 'src/libs/db/db.service';
import { decryptString } from 'src/utils/encryption.utils';
import { HypaToolExecutor } from '../agent/tool-executor';
import { DeveloperSharedService } from '../developer/providers/shared.service';
import { OrderEvents } from '../webhooks/order-events';
import { sendTemplate, sendText } from './whatsapp.client';
import { withinServiceWindow } from './whatsapp.service';

type Step = 'link_sent_at' | 'receipt_sent_at';
type Loaded = Awaited<ReturnType<WhatsappPaymentService['load']>>;
type Message = { text: string; template: { name: string; parameters: string[] } };

/**
 * The two messages a WhatsApp customer gets about an order: the payment link once the merchant approves it, and the receipt once PayPal says it is paid.
 * Each goes out once per order, however many times the approval or the webhook arrives.
 */
@Injectable()
export class WhatsappPaymentService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappPaymentService.name);

  constructor(
    private readonly db: DbService,
    private readonly tools: HypaToolExecutor,
    private readonly billing: DeveloperSharedService,
    private readonly events: OrderEvents,
  ) {}

  onModuleInit() {
    this.events.on('approved', (orderId) => this.sendLink(orderId));
    this.events.on('paid', (orderId) => this.sendReceipt(orderId));
  }

  async sendLink(orderId: string): Promise<void> {
    await this.once(orderId, 'link_sent_at', async ({ order, number }) => {
      if (order.status !== 'approved') return null;
      // The one `paypal` tool makes the checkout and writes the message in the customer's language, amount and link unchanged.
      const apiKey = await this.billing.findOrCreateUserApiKey(number.userId);
      const executor = this.tools.forCaller({ userId: number.userId, apiKeyId: apiKey.id, merchantId: number.userId, surface: 'app' });
      const paypal = HYPA_TOOLS.find((tool) => tool.name === 'paypal')!;
      const link = (await runHypaTool(paypal, executor, { action: 'send_payment_link', orderId })) as { checkoutUrl: string; message: string };
      return {
        text: link.message,
        template: { name: process.env.WHATSAPP_PAYMENT_LINK_TEMPLATE?.trim() || 'invoice_ready', parameters: [this.amount(order), link.checkoutUrl] },
      };
    });
  }

  /** The owner sends the payment link of an approved order to the customer, again if it went before, or for the first time if sending failed. */
  async resendLink(userId: string, orderId: string): Promise<void> {
    const link = await this.db.whatsapp_order.findFirst({ where: { order_id: orderId, thread: { number: { userId } } } });
    if (!link) throw new NotFoundException('Order not found');
    const order = await this.db.commerce_order.findUnique({ where: { id: orderId }, select: { status: true } });
    if (order?.status !== 'approved') throw new BadRequestException('Only an approved order can be sent for payment');
    await this.db.whatsapp_order.update({ where: { order_id: orderId }, data: { link_sent_at: null } });
    await this.sendLink(orderId).catch((error: Error) => {
      throw new BadRequestException(error.message);
    });
  }

  async sendReceipt(orderId: string): Promise<void> {
    await this.once(orderId, 'receipt_sent_at', async ({ order }) => {
      if (order.status !== 'paid') return null;
      const amount = this.amount(order);
      return {
        text: `${receiptLabels(order.customer.language).successTitle}: ${amount}`,
        template: { name: process.env.WHATSAPP_PAYMENT_RECEIPT_TEMPLATE?.trim() || 'payment_received', parameters: [amount] },
      };
    });
  }

  /** Does nothing for an order that did not start on WhatsApp, or whose message already went out. Gives the claim back if sending fails. */
  private async once(
    orderId: string,
    step: Step,
    build: (context: Pick<Loaded, 'order' | 'number'>) => Promise<Message | null>,
  ) {
    const claimed = await this.db.whatsapp_order.updateMany({ where: { order_id: orderId, [step]: null }, data: { [step]: new Date() } });
    if (!claimed.count) return;
    try {
      const { link, order, number } = await this.load(orderId);
      const message = await build({ order, number });
      if (!message) {
        await this.db.whatsapp_order.update({ where: { order_id: orderId }, data: { [step]: null } });
        return;
      }
      const to = await decryptString(link.thread.customer_wa_id);
      if (withinServiceWindow(link.thread.last_inbound_at)) {
        await sendText(number.phone_number_id, to, message.text);
      } else {
        await sendTemplate(number.phone_number_id, to, { ...message.template, language: this.templateLanguage(order.customer.language) });
      }
      await this.db.whatsapp_draft.create({ data: { threadId: link.threadId, text: message.text, status: 'sent', sent_at: new Date() } });
    } catch (error) {
      await this.db.whatsapp_order.update({ where: { order_id: orderId }, data: { [step]: null } }).catch(() => undefined);
      this.logger.warn(`A WhatsApp ${step === 'link_sent_at' ? 'payment link' : 'receipt'} was not sent: ${(error as Error).message}`);
      throw error;
    }
  }

  private amount(order: { amount: { toString(): string }; currency: string }) {
    return `${order.currency} ${order.amount.toString()}`;
  }

  private async load(orderId: string) {
    const link = await this.db.whatsapp_order.findUniqueOrThrow({ where: { order_id: orderId }, include: { thread: { include: { number: true } } } });
    const order = await this.db.commerce_order.findUniqueOrThrow({ where: { id: orderId }, include: { customer: true } });
    return { link, order, number: link.thread.number };
  }

  /** A template can only be sent in a language it was approved in, so the customer's language is used only when it is listed; English otherwise. */
  private templateLanguage(language: string | null) {
    const approved = (process.env.WHATSAPP_TEMPLATE_LANGUAGES ?? '').split(',').map((code) => code.trim()).filter(Boolean);
    return language && approved.includes(language) ? language : 'en';
  }
}

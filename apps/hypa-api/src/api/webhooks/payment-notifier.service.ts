import { Injectable } from '@nestjs/common';
import { paidMessage } from '@hypa/intelligence-core/payment-approval';
import { DbService } from 'src/libs/db/db.service';
import { PushService } from '../push/push.service';

/**
 * Tells the merchant a customer has paid: a message in the chat the order came from, in the
 * merchant's language, and a notification for when the app is closed. Called once per order, when
 * its payment first settles.
 */
@Injectable()
export class PaymentNotifier {
  constructor(
    private readonly db: DbService,
    private readonly push: PushService,
  ) {}

  async orderPaid(orderId: string) {
    const order = await this.db.commerce_order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) return;
    const text = paidMessage(order.merchant_language, order.customer.name, order.amount.toString(), order.currency);
    const chatId = await this.chatOf(order.merchantId, order.agent_request_id);

    if (chatId) {
      try {
        // The id is the order's, so the same payment can never post the message twice.
        await this.db.message.create({
          data: { id: `payment-paid-${order.id}`, chatId, role: 'assistant', content: text },
        });
        await this.db.chat.update({ where: { id: chatId }, data: { updated_at: new Date() } });
      } catch (error) {
        // Already posted: the merchant has been told, so no second notification either.
        if ((error as { code?: string })?.code === 'P2002') return;
        throw error;
      }
    }
    await this.push.send(order.merchantId, {
      title: 'Hypa',
      body: text,
      data: { type: 'payment.paid', orderId: order.id, ...(chatId ? { chatId } : {}) },
    });
  }

  /**
   * An order made by the agent remembers its run as "<run id>:<fingerprint>"; the run knows its
   * chat. Orders from outside agents, and from runs that were not kept, have no chat.
   */
  private async chatOf(merchantId: string, agentRequestId: string | null) {
    if (!agentRequestId) return null;
    const cut = agentRequestId.lastIndexOf(':');
    const run = await this.db.agent_run.findFirst({
      where: { request_id: cut > 0 ? agentRequestId.slice(0, cut) : agentRequestId, user_id: merchantId },
      select: { chat_id: true },
    });
    return run?.chat_id ?? null;
  }
}

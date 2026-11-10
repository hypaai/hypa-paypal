import { Injectable, Logger } from '@nestjs/common';

export type OrderEvent = 'approved' | 'paid';

/** Lets a channel such as WhatsApp follow an order without the order code knowing about it. */
@Injectable()
export class OrderEvents {
  private readonly logger = new Logger(OrderEvents.name);
  private readonly listeners: Record<OrderEvent, Array<(orderId: string) => Promise<void>>> = { approved: [], paid: [] };

  on(event: OrderEvent, listener: (orderId: string) => Promise<void>) {
    this.listeners[event].push(listener);
  }

  /** Runs after the change is saved. A listener that fails is logged; it never undoes an approval or a payment. */
  async emit(event: OrderEvent, orderId: string): Promise<void> {
    for (const listener of this.listeners[event]) {
      await listener(orderId).catch((error: Error) => this.logger.warn(`An order ${event} listener failed: ${error.message}`));
    }
  }
}

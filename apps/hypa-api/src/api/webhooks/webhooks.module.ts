import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { OrderEvents } from './order-events';
import { PayPalWebhookService } from './paypal-webhook.service';
import { PaymentNotifier } from './payment-notifier.service';
import { PushModule } from '../push/push.module';

@Module({
  imports: [PushModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, PayPalWebhookService, OrderEvents, PaymentNotifier],
  exports: [PayPalWebhookService, OrderEvents],
})
export class WebhooksModule {}

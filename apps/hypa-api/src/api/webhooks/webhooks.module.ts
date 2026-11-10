import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { OrderEvents } from './order-events';
import { PayPalWebhookService } from './paypal-webhook.service';

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService, PayPalWebhookService, OrderEvents],
  exports: [PayPalWebhookService, OrderEvents],
})
export class WebhooksModule {}

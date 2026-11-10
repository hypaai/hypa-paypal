import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PayPalWebhookService } from './paypal-webhook.service';

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService, PayPalWebhookService],
  exports: [PayPalWebhookService],
})
export class WebhooksModule {}

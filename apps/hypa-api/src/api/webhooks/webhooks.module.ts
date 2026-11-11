import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PayPalWebhookService } from './paypal-webhook.service';
import { PaymentNotifier } from './payment-notifier.service';
import { PushModule } from '../push/push.module';

@Module({
  imports: [PushModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, PayPalWebhookService, PaymentNotifier],
  exports: [PayPalWebhookService],
})
export class WebhooksModule {}

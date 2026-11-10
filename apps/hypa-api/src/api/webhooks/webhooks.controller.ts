import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import type { RunpodWebhookPayload } from '../developer/ws/pod.service';
import { WebhooksService } from './webhooks.service';
import { PayPalWebhookService } from './paypal-webhook.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly paypalWebhookService: PayPalWebhookService,
  ) {}

  @Post('runpod/status')
  runpodStatus(@Body() body: RunpodWebhookPayload) {
    this.webhooksService.runpodStatus(body);
    return { received: true };
  }

  @Post('paypal')
  paypal(
    @Req() req: { rawBody?: Buffer },
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw PayPal request body');
    }
    return this.paypalWebhookService.handle(headers, req.rawBody);
  }
}

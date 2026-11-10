import { timingSafeEqual } from 'node:crypto';
import { Controller, ForbiddenException, Get, Header, Headers, HttpCode, Post, Query, Req } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { parseIncomingMessages } from './whatsapp.payload';
import { WhatsappQueue } from './whatsapp.queue';
import { WhatsappService } from './whatsapp.service';
import { verifyMetaSignature } from './whatsapp.signature';

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Meta's side of the bridge. It is public by design, so the signature is the only way in; the global rate limit would drop real customer messages. */
@SkipThrottle()
@Controller('v2/whatsapp')
export class WhatsappWebhookController {
  constructor(
    private readonly service: WhatsappService,
    private readonly queue: WhatsappQueue,
  ) {}

  /** Meta's one-time handshake when the webhook URL is saved in the app. */
  @Get('webhook')
  @Header('Content-Type', 'text/plain')
  verify(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
  ) {
    const expected = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
    if (mode !== 'subscribe' || !expected || !token || !challenge || !same(token, expected)) throw new ForbiddenException();
    return challenge;
  }

  @Post('webhook')
  @HttpCode(200)
  async receive(@Req() req: { rawBody?: Buffer; body?: unknown }, @Headers('x-hub-signature-256') signature?: string) {
    if (!verifyMetaSignature(req.rawBody, signature, process.env.WHATSAPP_APP_SECRET?.trim())) {
      throw new ForbiddenException('Invalid signature');
    }
    const fresh = await this.service.claimNew(parseIncomingMessages(req.body));
    try {
      await this.queue.enqueue(fresh);
    } catch (error) {
      await this.service.release(fresh);
      throw error;
    }
    return { received: true };
  }
}

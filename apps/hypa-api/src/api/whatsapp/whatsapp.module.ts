import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DEFAULT_JOB_OPTIONS, QUEUE_NAMES } from 'src/queues/queue.constants';
import { AgentModule } from '../agent/agent.module';
import { CommerceModule } from '../commerce/commerce.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { WhatsappOwnerController } from './whatsapp.owner.controller';
import { WhatsappOwnerService } from './whatsapp.owner.service';
import { WhatsappPaymentService } from './whatsapp.payment';
import { WhatsappProcessor, WhatsappQueue } from './whatsapp.queue';
import { WhatsappService } from './whatsapp.service';
import { WhatsappWebhookController } from './whatsapp.webhook.controller';

@Module({
  imports: [
    AgentModule,
    CommerceModule,
    WebhooksModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.WHATSAPP_QUEUE,
      defaultJobOptions: { ...DEFAULT_JOB_OPTIONS, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    }),
  ],
  controllers: [WhatsappWebhookController, WhatsappOwnerController],
  providers: [WhatsappService, WhatsappOwnerService, WhatsappPaymentService, WhatsappQueue, WhatsappProcessor],
})
export class WhatsappModule {}

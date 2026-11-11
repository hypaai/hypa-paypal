import { createHash } from 'node:crypto';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { QUEUE_NAMES } from 'src/queues/queue.constants';
import { type IncomingMessage } from './whatsapp.payload';
import { WhatsappService } from './whatsapp.service';

/** Meta retries a webhook that is slow, so the webhook only queues the work and answers at once. */
@Injectable()
export class WhatsappQueue {
  constructor(@InjectQueue(QUEUE_NAMES.WHATSAPP_QUEUE) private readonly queue: Queue) {}

  async enqueue(messages: IncomingMessage[]): Promise<void> {
    if (!messages.length) return;
    await this.queue.addBulk(
      messages.map((message) => ({
        name: 'message',
        data: message,
        opts: { jobId: createHash('sha256').update(message.id).digest('hex').slice(0, 32) },
      })),
    );
  }
}

@Processor(QUEUE_NAMES.WHATSAPP_QUEUE, { concurrency: 4 })
export class WhatsappProcessor extends WorkerHost {
  constructor(private readonly service: WhatsappService) {
    super();
  }

  async process(job: Job<Omit<IncomingMessage, 'sentAt'> & { sentAt: string }>): Promise<void> {
    await this.service.handle({ ...job.data, sentAt: new Date(job.data.sentAt) });
  }
}

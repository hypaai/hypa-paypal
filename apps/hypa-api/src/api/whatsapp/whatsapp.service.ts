import { createHash, createHmac } from 'node:crypto';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import errorCodes from '@hypa/config/json/error-codes';
import { getBridgePrompt, renderPrompt } from '@hypa/config/prompts';
import type { AgentEvent } from '../agent/agent.loop';
import { DbService } from 'src/libs/db/db.service';
import { decryptString, encryptString } from 'src/utils/encryption.utils';
import { Prisma } from 'src/generated/prisma/client';
import { AgentMediaService } from '../agent/agent.media';
import { AgentService } from '../agent/agent.service';
import { businessProfileSchema, hoursText, unlistedAmounts, type BusinessProfile } from './bridge.profile';
import { bridgeTools, type RecordedOrder } from './bridge.tools';
import { convertAudio } from './whatsapp.audio';
import {
  downloadMedia,
  sendAudio,
  sendImage,
  sendTemplate,
  sendText,
  uploadMedia,
} from './whatsapp.client';
import { type IncomingMessage } from './whatsapp.payload';

/** Muse Spark runs the business agent, unless `WHATSAPP_MODEL` ("provider/model") names another. */
function bridgeModel() {
  const [provider, ...rest] = (process.env.WHATSAPP_MODEL?.trim() || 'meta/muse-spark-1.3').split('/');
  return { provider, model: rest.join('/') };
}

/** Only what a shop assistant needs. Payments are a later ticket. */
const BRIDGE_TOOLS = ['text_to_speech', 'translate_message', 'extract_text_from_image', 'list_languages'];

const WINDOW_MS = 24 * 60 * 60 * 1000;

/** WhatsApp lets a business write freely only within 24 hours of the customer's last message. */
export const withinServiceWindow = (lastInboundAt: Date, now = new Date()) => now.getTime() - lastInboundAt.getTime() < WINDOW_MS;

/** The customer's number, hashed so a thread can be found without keeping it readable. */
export const customerHash = (waId: string) =>
  createHmac('sha256', process.env.ENCRYPTION_KEY ?? '').update(`whatsapp-customer:${waId}`).digest('hex');

/** A stable agent request id for one WhatsApp message, so a retried job reuses the turn it already ran. */
export function requestIdFor(messageId: string): string {
  const bytes = createHash('sha256').update(`whatsapp:${messageId}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const mediaKey = (url: string) => new URL(url, 'http://media').searchParams.get('key') ?? undefined;

const isLowBalance = (error: unknown) => {
  const source = error as { message?: string; response?: { code?: number; message?: string } } | null;
  return (
    source?.response?.code === errorCodes.INSUFFICIENT_BALANCE.code ||
    source?.message === errorCodes.INSUFFICIENT_BALANCE.message ||
    source?.response?.message === errorCodes.INSUFFICIENT_BALANCE.message
  );
};

type NumberRow = Prisma.whatsapp_numberGetPayload<object>;
type ThreadRow = Prisma.whatsapp_threadGetPayload<object>;
type DraftRow = Prisma.whatsapp_draftGetPayload<object>;

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly db: DbService,
    private readonly agent: AgentService,
    private readonly media: AgentMediaService,
  ) {}

  /** Keeps the messages not seen before. Meta can deliver the same message twice, and a duplicate must run once. */
  async claimNew(messages: IncomingMessage[]): Promise<IncomingMessage[]> {
    const fresh: IncomingMessage[] = [];
    for (const message of messages) {
      try {
        await this.db.whatsapp_event.create({ data: { id: message.id } });
        fresh.push(message);
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error;
      }
    }
    return fresh;
  }

  /** One customer message, start to finish: understand it, draft the reply, send it when the owner allows. */
  async handle(message: IncomingMessage): Promise<void> {
    const number = await this.db.whatsapp_number.findUnique({ where: { phone_number_id: message.phoneNumberId } });
    if (!number) {
      this.logger.warn('A WhatsApp message arrived for a number that is not connected');
      return;
    }
    const thread = await this.threadFor(number, message);
    if (thread.mode === 'owner') {
      await this.keepForOwner(thread, message);
      return;
    }
    const profile = businessProfileSchema.safeParse(number.profile);
    if (!profile.success) {
      await this.setAlert(number.id, 'profile_incomplete');
      return;
    }
    const token = await this.tokenOf(number);
    let order: RecordedOrder | undefined;
    let handoff: string | undefined;
    const tools = bridgeTools({
      profile: profile.data,
      saveOrder: async (saved) => {
        order = saved;
        await this.db.whatsapp_thread.update({ where: { id: thread.id }, data: { order: saved } });
      },
      askOwner: async (reason) => {
        handoff = reason;
      },
    });

    const turn = await this.turnInput(message, token);
    let events: AgentEvent[];
    try {
      const job = await this.agent.open({
        requestId: requestIdFor(message.id),
        userId: number.userId,
        ...bridgeModel(),
        surface: 'app',
        chatId: thread.chatId,
        language: profile.data.languages[0],
        systemInstruction: this.prompt(profile.data, thread.customer_name),
        toolNames: BRIDGE_TOOLS,
        extraTools: tools,
        modelOptions: { temperature: 0.3 },
        ...turn,
      });
      await job.finished;
      events = job.events;
    } catch (error) {
      if (isLowBalance(error)) return this.pauseForFunds(number);
      throw error;
    }

    const failure = events.find((event) => event.type === 'error');
    if (failure && failure.message === errorCodes.INSUFFICIENT_BALANCE.message) return this.pauseForFunds(number);
    const done = [...events].reverse().find((event) => event.type === 'done');
    if (!done || done.type !== 'done' || !done.text.trim()) {
      throw new Error(`The agent gave no reply (${failure && failure.type === 'error' ? failure.code : 'no result'})`);
    }
    if (number.alert) await this.setAlert(number.id, null);

    const audio = [...events].reverse().find((event) => event.type === 'audio');
    const priceWarning = unlistedAmounts(profile.data, done.text, order?.items).length > 0;
    const draft = await this.db.whatsapp_draft.create({
      data: {
        threadId: thread.id,
        text: done.text.trim(),
        audio_key: audio && audio.type === 'audio' ? mediaKey(audio.url) : undefined,
        order: order as Prisma.InputJsonValue | undefined,
        needs_owner: handoff !== undefined,
        price_warning: priceWarning,
        reason: handoff,
      },
    });
    await this.db.whatsapp_thread.update({ where: { id: thread.id }, data: { updated_at: new Date() } });

    // Quotes, orders, anything the agent could not answer, and any price off the list wait for the owner.
    const simple = !order && handoff === undefined && !priceWarning;
    if (number.auto_reply && simple) await this.deliver(number, thread, draft);
  }

  /** The owner approves a draft, with its text edited if they like. */
  async send(userId: string, draftId: string, text?: string): Promise<DraftRow> {
    const { draft, thread, number } = await this.ownedDraft(userId, draftId);
    if (draft.status !== 'pending' && draft.status !== 'template_sent') throw new BadRequestException('This draft was already handled');
    return this.deliver(number, thread, text?.trim() ? { ...draft, text: text.trim() } : draft);
  }

  async discard(userId: string, draftId: string): Promise<void> {
    const { draft } = await this.ownedDraft(userId, draftId);
    await this.db.whatsapp_draft.update({ where: { id: draft.id }, data: { status: 'discarded' } });
  }

  /** The owner writes to the customer themselves. Taking over stops the agent; handing back lets it answer again. */
  async setMode(userId: string, threadId: string, mode: 'agent' | 'owner'): Promise<void> {
    const { thread } = await this.ownedThread(userId, threadId);
    await this.db.whatsapp_thread.update({ where: { id: thread.id }, data: { mode } });
    if (mode === 'owner') {
      await this.db.whatsapp_draft.updateMany({ where: { threadId: thread.id, status: 'pending' }, data: { status: 'discarded' } });
    }
  }

  async reply(userId: string, threadId: string, text: string): Promise<void> {
    const { thread, number } = await this.ownedThread(userId, threadId);
    const draft = await this.db.whatsapp_draft.create({ data: { threadId: thread.id, text } });
    await this.deliver(number, thread, draft);
  }

  /** Sends a draft: free-form inside the 24-hour window, the approved template outside it. */
  private async deliver(number: NumberRow, thread: ThreadRow, draft: DraftRow): Promise<DraftRow> {
    const token = await this.tokenOf(number);
    const to = await decryptString(thread.customer_wa_id);
    if (!withinServiceWindow(thread.last_inbound_at)) {
      const template = { name: process.env.WHATSAPP_QUOTE_TEMPLATE?.trim() || 'quote_ready', language: process.env.WHATSAPP_QUOTE_TEMPLATE_LANGUAGE?.trim() || 'en' };
      await sendTemplate(number.phone_number_id, token, to, template);
      return this.db.whatsapp_draft.update({ where: { id: draft.id }, data: { status: 'template_sent', text: draft.text, sent_at: new Date() } });
    }
    await sendText(number.phone_number_id, token, to, draft.text);
    if (draft.audio_key) {
      const recording = await this.media.get(draft.audio_key);
      if (recording) {
        const id = await uploadMedia(number.phone_number_id, token, await convertAudio(recording, 'voice'), 'audio/ogg');
        await sendAudio(number.phone_number_id, token, to, id);
      }
    }
    for (const key of draft.image_keys) {
      const picture = await this.media.get(key);
      if (picture) {
        const mime = picture[0] === 0xff ? 'image/jpeg' : 'image/png';
        await sendImage(number.phone_number_id, token, to, await uploadMedia(number.phone_number_id, token, picture, mime));
      }
    }
    return this.db.whatsapp_draft.update({ where: { id: draft.id }, data: { status: 'sent', text: draft.text, sent_at: new Date() } });
  }

  /** The agent's input for what the customer sent: text as is, a voice note as audio to transcribe, a photo as an attachment. */
  private async turnInput(message: IncomingMessage, token: string) {
    if (message.kind === 'voice' && message.mediaId) {
      const { bytes } = await downloadMedia(message.mediaId, token);
      return { input: '', audio: (await convertAudio(bytes, 'speech')).toString('base64'), audioType: 'base64' as const, preferAudio: true };
    }
    if (message.kind === 'image' && message.mediaId) {
      const { bytes, mimeType } = await downloadMedia(message.mediaId, token);
      return { input: message.text ?? '', attachments: [{ data: bytes.toString('base64'), mime: mimeType.split(';')[0] }] };
    }
    if (message.kind === 'text') return { input: message.text ?? '' };
    return {
      input: 'The customer sent something you cannot read, such as a sticker, a location or a document. Reply politely in their language that you can read text, voice notes and photos, and ask them to send one of those.',
    };
  }

  private prompt(profile: BusinessProfile, customerName: string | null) {
    return renderPrompt(getBridgePrompt(), {
      businessName: profile.name,
      sells: profile.sells || 'its products',
      currency: profile.currency,
      priceList: profile.priceList.length ? profile.priceList.map((row) => `- ${row.name}: ${row.price}`).join('\n') : '(no prices listed yet)',
      hours: hoursText(profile.hours),
      tone: profile.tone ?? 'warm and respectful',
      customerName: customerName ?? 'not known',
    });
  }

  private async threadFor(number: NumberRow, message: IncomingMessage): Promise<ThreadRow> {
    const hash = customerHash(message.from);
    const existing = await this.db.whatsapp_thread.findUnique({ where: { numberId_customer_hash: { numberId: number.id, customer_hash: hash } } });
    if (existing) {
      return this.db.whatsapp_thread.update({
        where: { id: existing.id },
        data: { last_inbound_at: message.sentAt, ...(message.name ? { customer_name: message.name } : {}) },
      });
    }
    const chat = await this.db.chat.create({ data: { userId: number.userId, title: message.name ?? 'Customer', surface: 'whatsapp' } });
    return this.db.whatsapp_thread.create({
      data: {
        numberId: number.id,
        chatId: chat.id,
        customer_hash: hash,
        customer_wa_id: await encryptString(message.from),
        customer_name: message.name,
        last_inbound_at: message.sentAt,
      },
    });
  }

  /** While the owner has taken over, the agent stays quiet and the message just waits in the thread. */
  private async keepForOwner(thread: ThreadRow, message: IncomingMessage) {
    const content = message.text || { voice: 'Voice note', image: 'Photo', unsupported: 'Unsupported message', text: '' }[message.kind];
    await this.db.message.create({ data: { chatId: thread.chatId, role: 'user', content } });
    await this.db.whatsapp_thread.update({ where: { id: thread.id }, data: { updated_at: new Date() } });
  }

  private async pauseForFunds(number: NumberRow) {
    // The customer sees nothing: the owner gets the alert and tops up.
    this.logger.warn('A WhatsApp reply was held back: the business wallet is low');
    await this.setAlert(number.id, 'low_balance');
  }

  private setAlert(numberId: string, alert: string | null) {
    return this.db.whatsapp_number.update({ where: { id: numberId }, data: { alert } });
  }

  private tokenOf(number: NumberRow) {
    return decryptString(number.access_token);
  }

  private async ownedThread(userId: string, threadId: string) {
    const thread = await this.db.whatsapp_thread.findFirst({ where: { id: threadId, number: { userId } }, include: { number: true } });
    if (!thread) throw new NotFoundException('Thread not found');
    const { number, ...row } = thread;
    return { thread: row, number };
  }

  private async ownedDraft(userId: string, draftId: string) {
    const draft = await this.db.whatsapp_draft.findFirst({ where: { id: draftId, thread: { number: { userId } } }, include: { thread: { include: { number: true } } } });
    if (!draft) throw new NotFoundException('Draft not found');
    const { thread: withNumber, ...row } = draft;
    const { number, ...thread } = withNumber;
    return { draft: row, thread, number };
  }
}

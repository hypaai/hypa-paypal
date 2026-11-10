import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/libs/db/db.service';
import { encryptString } from 'src/utils/encryption.utils';
import { Prisma } from 'src/generated/prisma/client';
import { businessProfileSchema } from './bridge.profile';
import { exchangeSignupCode, findSharedNumber, readNumber, subscribeToWebhook } from './whatsapp.client';

const profileOf = (value: unknown) => {
  const parsed = businessProfileSchema.safeParse(value);
  if (!parsed.success) throw new BadRequestException(parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`));
  return parsed.data;
};

/** What the business owner sees and sets in the Intelligence app. */
@Injectable()
export class WhatsappOwnerService {
  constructor(private readonly db: DbService) {}

  private async numberOf(userId: string) {
    const number = await this.db.whatsapp_number.findFirst({ where: { userId }, orderBy: { created_at: 'asc' } });
    if (!number) throw new NotFoundException('No WhatsApp number is connected');
    return number;
  }

  private view(number: { id: string; display_phone: string | null; phone_number_id: string; profile: Prisma.JsonValue; auto_reply: boolean; alert: string | null }) {
    return { id: number.id, phoneNumberId: number.phone_number_id, displayPhone: number.display_phone, profile: number.profile, autoReply: number.auto_reply, alert: number.alert };
  }

  async getNumber(userId: string) {
    const number = await this.db.whatsapp_number.findFirst({ where: { userId }, orderBy: { created_at: 'asc' } });
    return number ? this.view(number) : null;
  }

  /** The token is proof the owner controls the number: it is checked with Meta before anything is saved. */
  async connect(userId: string, input: { phoneNumberId: string; accessToken: string; profile: unknown; autoReply?: boolean }) {
    const profile = profileOf(input.profile);
    const live = await readNumber(input.phoneNumberId, input.accessToken).catch(() => {
      throw new BadRequestException('WhatsApp did not accept that number and token');
    });
    const taken = await this.db.whatsapp_number.findUnique({ where: { phone_number_id: input.phoneNumberId } });
    if (taken && taken.userId !== userId) throw new ConflictException('That number is connected to another account');
    const data = { access_token: await encryptString(input.accessToken), display_phone: live.display_phone_number, profile, auto_reply: input.autoReply ?? false, alert: null };
    const number = taken
      ? await this.db.whatsapp_number.update({ where: { id: taken.id }, data })
      : await this.db.whatsapp_number.create({ data: { ...data, userId, phone_number_id: input.phoneNumberId } });
    return this.view(number);
  }

  /** Embedded Signup: Meta's login code stands in for the pasted number ID and token. */
  async connectWithMeta(userId: string, input: { code: string; profile: unknown; autoReply?: boolean }) {
    profileOf(input.profile);
    const shared = await exchangeSignupCode(input.code)
      .then(async (accessToken) => ({ accessToken, ...(await findSharedNumber(accessToken)) }))
      .catch((error: Error) => {
        throw new BadRequestException(error.message);
      });
    const number = await this.connect(userId, { phoneNumberId: shared.phoneNumberId, accessToken: shared.accessToken, profile: input.profile, autoReply: input.autoReply });
    await subscribeToWebhook(shared.wabaId, shared.accessToken).catch(() => {
      throw new BadRequestException('Connected, but WhatsApp would not send messages to Hypa. Try again.');
    });
    return number;
  }

  async update(userId: string, input: { profile?: unknown; autoReply?: boolean }) {
    const number = await this.numberOf(userId);
    const updated = await this.db.whatsapp_number.update({
      where: { id: number.id },
      data: {
        ...(input.profile !== undefined ? { profile: profileOf(input.profile), alert: number.alert === 'profile_incomplete' ? null : number.alert } : {}),
        ...(input.autoReply !== undefined ? { auto_reply: input.autoReply } : {}),
      },
    });
    return this.view(updated);
  }

  /** The Customers list: newest activity first, with what needs the owner. */
  async threads(userId: string) {
    const number = await this.numberOf(userId);
    const threads = await this.db.whatsapp_thread.findMany({
      where: { numberId: number.id },
      orderBy: { updated_at: 'desc' },
      take: 100,
      include: { drafts: { where: { status: 'pending' }, select: { needs_owner: true, price_warning: true } } },
    });
    return threads.map((thread) => ({
      id: thread.id,
      customerName: thread.customer_name,
      mode: thread.mode,
      updatedAt: thread.updated_at,
      pendingDrafts: thread.drafts.length,
      needsOwner: thread.drafts.some((draft) => draft.needs_owner),
      hasOrder: thread.order !== null,
    }));
  }

  async thread(userId: string, id: string) {
    const thread = await this.db.whatsapp_thread.findFirst({
      where: { id, number: { userId } },
      include: { drafts: { where: { status: { in: ['pending', 'template_sent'] } }, orderBy: { created_at: 'asc' } } },
    });
    if (!thread) throw new NotFoundException('Thread not found');
    // The conversation is what the customer wrote plus what was actually sent. The assistant's unsent drafts are shown apart, as drafts.
    const [written, sent] = await Promise.all([
      this.db.message.findMany({ where: { chatId: thread.chatId, role: 'user' }, orderBy: { created_at: 'asc' }, take: 200 }),
      this.db.whatsapp_draft.findMany({ where: { threadId: thread.id, status: 'sent' }, orderBy: { sent_at: 'asc' }, take: 200 }),
    ]);
    const messages = [
      ...written.map((message) => ({ id: message.id, role: message.role, content: message.content, createdAt: message.created_at })),
      ...sent.map((draft) => ({ id: draft.id, role: 'assistant', content: draft.text, createdAt: draft.sent_at ?? draft.created_at })),
    ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return {
      id: thread.id,
      customerName: thread.customer_name,
      mode: thread.mode,
      order: thread.order,
      messages,
      drafts: thread.drafts.map((draft) => ({
        id: draft.id,
        status: draft.status,
        text: draft.text,
        hasAudio: draft.audio_key !== null,
        images: draft.image_keys.length,
        order: draft.order,
        needsOwner: draft.needs_owner,
        priceWarning: draft.price_warning,
        reason: draft.reason,
      })),
    };
  }
}

import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DbService } from 'src/libs/db/db.service';
import { Prisma } from 'src/generated/prisma/client';
import { businessProfileSchema } from './bridge.profile';
import { readNumber, whatsappNumberIds } from './whatsapp.client';

const profileOf = (value: unknown) => {
  const parsed = businessProfileSchema.safeParse(value);
  if (!parsed.success) throw new BadRequestException(parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`));
  return parsed.data;
};

/** What the business owner sees and sets in the Intelligence app. */
@Injectable()
export class WhatsappOwnerService {
  constructor(private readonly db: DbService) {}

  private ownNumber(userId: string) {
    return this.db.whatsapp_number.findFirst({ where: { userId }, orderBy: { created_at: 'asc' } });
  }

  private async numberOf(userId: string) {
    const number = await this.ownNumber(userId);
    if (!number) throw new NotFoundException('No WhatsApp number is connected');
    return number;
  }

  private view(number: { id: string; display_phone: string | null; phone_number_id: string; profile: Prisma.JsonValue; auto_reply: boolean; alert: string | null }) {
    return { id: number.id, phoneNumberId: number.phone_number_id, displayPhone: number.display_phone, profile: number.profile, autoReply: number.auto_reply, alert: number.alert };
  }

  async getNumber(userId: string) {
    const number = await this.ownNumber(userId);
    return number ? this.view(number) : null;
  }

  /**
   * Gives the business one of Hypa's WhatsApp numbers: its own if it has one already, else the first number nobody uses.
   * Customers write to that number, and the business never handles a Meta credential.
   */
  async connect(userId: string, input: { profile: unknown; autoReply?: boolean }) {
    const profile = profileOf(input.profile);
    const own = await this.ownNumber(userId);
    const offered = whatsappNumberIds();
    // A business keeps its number. One that is no longer on Hypa's list (say a local-demo id) is moved to one that is, threads and all.
    if (own && (!offered.length || offered.includes(own.phone_number_id))) {
      return this.view(await this.db.whatsapp_number.update({ where: { id: own.id }, data: { profile, auto_reply: input.autoReply ?? own.auto_reply, alert: null } }));
    }
    if (!offered.length) throw new ServiceUnavailableException('WhatsApp is not set up on this server');
    // Hypa has few numbers for now, so only the listed accounts may take one.
    const user = await this.db.user.findUnique({ where: { id: userId }, select: { email: true } });
    const allowed = (process.env.WHATSAPP_CONNECT_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
    if (!user || !allowed.includes(user.email.toLowerCase())) throw new ForbiddenException('Hypa Bridge is not open to this account yet');
    const used = new Set((await this.db.whatsapp_number.findMany({ where: { phone_number_id: { in: offered } }, select: { phone_number_id: true } })).map((row) => row.phone_number_id));
    const free = offered.find((id) => !used.has(id));
    if (!free) throw new ConflictException('Every WhatsApp number is in use right now');
    // Reading the number proves Hypa's token works for it, and gives the number customers see.
    const live = await readNumber(free).catch((error: Error) => {
      throw new BadRequestException(`WhatsApp did not accept that number: ${error.message}`);
    });
    const data = { phone_number_id: free, display_phone: live.display_phone_number, profile, auto_reply: input.autoReply ?? own?.auto_reply ?? false, alert: null };
    const save = own ? this.db.whatsapp_number.update({ where: { id: own.id }, data }) : this.db.whatsapp_number.create({ data: { userId, ...data } });
    const number = await save.catch((error: unknown) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('That WhatsApp number was just taken. Try again.');
      throw error;
    });
    return this.view(number);
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

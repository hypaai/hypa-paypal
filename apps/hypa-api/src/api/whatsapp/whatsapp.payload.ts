export type IncomingKind = 'text' | 'voice' | 'image' | 'unsupported';

/** One customer message, reduced to what the bridge needs. */
export interface IncomingMessage {
  /** WhatsApp's message id. Meta can deliver a message twice, so this is the dedupe key. */
  id: string;
  /** Cloud API id of the business number the customer wrote to. */
  phoneNumberId: string;
  /** The customer's WhatsApp id, which is their phone number. Never log it. */
  from: string;
  name?: string;
  sentAt: Date;
  kind: IncomingKind;
  /** The text, or a photo's caption. */
  text?: string;
  mediaId?: string;
  mimeType?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const str = (value: unknown) => (typeof value === 'string' && value ? value : undefined);
const list = (value: unknown) => (Array.isArray(value) ? value : []);

/**
 * Pulls the customer messages out of a Cloud API webhook body. Delivery and read
 * receipts (`statuses`) and reactions carry no request, so they are left out.
 */
export function parseIncomingMessages(payload: unknown): IncomingMessage[] {
  if (!isRecord(payload) || payload.object !== 'whatsapp_business_account') return [];
  const found: IncomingMessage[] = [];
  for (const entry of list(payload.entry)) {
    for (const change of list(isRecord(entry) ? entry.changes : undefined)) {
      const value = isRecord(change) && change.field === 'messages' ? change.value : undefined;
      if (!isRecord(value)) continue;
      const phoneNumberId = isRecord(value.metadata) ? str(value.metadata.phone_number_id) : undefined;
      if (!phoneNumberId) continue;
      const names = new Map<string, string>();
      for (const contact of list(value.contacts)) {
        if (!isRecord(contact)) continue;
        const name = isRecord(contact.profile) ? str(contact.profile.name) : undefined;
        const id = str(contact.wa_id);
        if (id && name) names.set(id, name);
      }
      for (const raw of list(value.messages)) {
        if (!isRecord(raw)) continue;
        const id = str(raw.id);
        const from = str(raw.from);
        const type = str(raw.type);
        if (!id || !from || !type || type === 'reaction') continue;
        const seconds = Number(raw.timestamp);
        const base = {
          id,
          phoneNumberId,
          from,
          name: names.get(from),
          sentAt: new Date(Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : Date.now()),
        };
        const media = isRecord(raw[type]) ? (raw[type] as Record<string, unknown>) : {};
        if (type === 'text') {
          const text = str(media.body);
          found.push({ ...base, kind: text ? 'text' : 'unsupported', text });
        } else if (type === 'audio' && str(media.id)) {
          found.push({ ...base, kind: 'voice', mediaId: str(media.id), mimeType: str(media.mime_type) });
        } else if (type === 'image' && str(media.id)) {
          found.push({ ...base, kind: 'image', mediaId: str(media.id), mimeType: str(media.mime_type), text: str(media.caption) });
        } else {
          found.push({ ...base, kind: 'unsupported' });
        }
      }
    }
  }
  return found;
}

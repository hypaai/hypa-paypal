/** The few WhatsApp Cloud API calls the bridge makes, over Meta's Graph API, with Hypa's own access token. */

/** Meta's Graph API. `WHATSAPP_GRAPH_URL` points it at `scripts/whatsapp-sim.ts` for local demos. */
const graphHost = () => process.env.WHATSAPP_GRAPH_URL?.trim() || 'https://graph.facebook.com';
const graph = () => `${graphHost()}/${process.env.WHATSAPP_GRAPH_VERSION?.trim() || 'v23.0'}`;

/** A voice note or photo bigger than this is refused rather than read into memory. */
export const MAX_MEDIA_BYTES = 16 * 1024 * 1024;

export class WhatsappApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** The phone number ids of Hypa's WhatsApp numbers that businesses can use (`WHATSAPP_PHONE_NUMBER_IDS`, comma separated). */
export const whatsappNumberIds = () =>
  (process.env.WHATSAPP_PHONE_NUMBER_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

function token() {
  const value = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  if (!value) throw new WhatsappApiError('WhatsApp is not set up on this server', 503);
  return value;
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token()}`, ...init.headers } });
  if (!response.ok) {
    let reason = `WhatsApp request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) reason = `${reason}: ${body.error.message}`;
    } catch {
      // Keep the status message.
    }
    throw new WhatsappApiError(reason, response.status);
  }
  return (await response.json()) as T;
}

const send = (phoneNumberId: string, body: Record<string, unknown>) =>
  request<{ messages?: { id: string }[] }>(`${graph()}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', ...body }),
  });

/** Proves the token can act for this number, and reads the number shown to customers. */
export async function readNumber(phoneNumberId: string) {
  return request<{ id: string; display_phone_number?: string }>(`${graph()}/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number`);
}

export async function downloadMedia(mediaId: string): Promise<{ bytes: Buffer; mimeType: string }> {
  const info = await request<{ url: string; mime_type?: string; file_size?: number }>(`${graph()}/${encodeURIComponent(mediaId)}`);
  const trusted = info.url.startsWith('https://') || (!!process.env.WHATSAPP_GRAPH_URL?.trim() && info.url.startsWith(`${graphHost()}/`));
  if (!trusted) throw new WhatsappApiError('WhatsApp media link is not https', 502);
  if ((info.file_size ?? 0) > MAX_MEDIA_BYTES) throw new WhatsappApiError('WhatsApp media is too large', 413);
  const response = await fetch(info.url, { headers: { Authorization: `Bearer ${token()}` } });
  if (!response.ok) throw new WhatsappApiError(`WhatsApp media download failed (${response.status})`, response.status);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_MEDIA_BYTES) throw new WhatsappApiError('WhatsApp media is too large', 413);
  return { bytes, mimeType: info.mime_type ?? response.headers.get('content-type') ?? 'application/octet-stream' };
}

export async function uploadMedia(phoneNumberId: string, bytes: Buffer, mimeType: string): Promise<string> {
  const form = new FormData();
  form.set('messaging_product', 'whatsapp');
  form.set('type', mimeType);
  form.set('file', new Blob([new Uint8Array(bytes)], { type: mimeType }), 'reply');
  const uploaded = await request<{ id: string }>(`${graph()}/${phoneNumberId}/media`, { method: 'POST', body: form });
  return uploaded.id;
}

export const sendText = (phoneNumberId: string, to: string, body: string) =>
  send(phoneNumberId, { to, type: 'text', text: { body, preview_url: false } });

export const sendAudio = (phoneNumberId: string, to: string, mediaId: string) => send(phoneNumberId, { to, type: 'audio', audio: { id: mediaId } });

export const sendImage = (phoneNumberId: string, to: string, mediaId: string) => send(phoneNumberId, { to, type: 'image', image: { id: mediaId } });

/** The only kind of message WhatsApp lets a business start after the 24-hour window has closed. */
export const sendTemplate = (phoneNumberId: string, to: string, template: { name: string; language: string; parameters?: string[] }) =>
  send(phoneNumberId, {
    to,
    type: 'template',
    template: {
      name: template.name,
      language: { code: template.language },
      ...(template.parameters?.length ? { components: [{ type: 'body', parameters: template.parameters.map((text) => ({ type: 'text', text })) }] } : {}),
    },
  });

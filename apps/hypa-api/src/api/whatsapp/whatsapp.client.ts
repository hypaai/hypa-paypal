/** The few WhatsApp Cloud API calls the bridge makes, over Meta's Graph API. */

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

async function request<T>(url: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...init.headers } });
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

const send = (phoneNumberId: string, token: string, body: Record<string, unknown>) =>
  request<{ messages?: { id: string }[] }>(`${graph()}/${phoneNumberId}/messages`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', ...body }),
  });

/** Embedded Signup: the owner logs in to Meta in the app, and Meta returns a code the API trades for their token. */
export const SIGNUP_REDIRECT = 'https://www.facebook.com/connect/login_success.html';

const appToken = () => `${process.env.META_APP_ID}|${process.env.WHATSAPP_APP_SECRET}`;

/** The Meta login URL for the app to open, or null until `META_APP_ID` and `WHATSAPP_EMBEDDED_CONFIG_ID` are set. */
export function signupUrl() {
  const appId = process.env.META_APP_ID?.trim();
  const configId = process.env.WHATSAPP_EMBEDDED_CONFIG_ID?.trim();
  if (!appId || !configId || !process.env.WHATSAPP_APP_SECRET) return null;
  const query = new URLSearchParams({
    client_id: appId,
    redirect_uri: SIGNUP_REDIRECT,
    response_type: 'code',
    override_default_response_type: 'true',
    config_id: configId,
  });
  return `https://www.facebook.com/${process.env.WHATSAPP_GRAPH_VERSION?.trim() || 'v23.0'}/dialog/oauth?${query}`;
}

export async function exchangeSignupCode(code: string) {
  const query = new URLSearchParams({
    client_id: process.env.META_APP_ID ?? '',
    client_secret: process.env.WHATSAPP_APP_SECRET ?? '',
    redirect_uri: SIGNUP_REDIRECT,
    code,
  });
  return (await request<{ access_token: string }>(`${graph()}/oauth/access_token?${query}`, appToken())).access_token;
}

/** The WhatsApp Business Account the owner shared with Hypa, and the first number on it. */
export async function findSharedNumber(token: string) {
  const debug = await request<{ data: { granular_scopes?: { scope: string; target_ids?: string[] }[] } }>(
    `${graph()}/debug_token?input_token=${encodeURIComponent(token)}`,
    appToken(),
  );
  const wabaId = debug.data.granular_scopes?.find((item) => item.scope === 'whatsapp_business_management')?.target_ids?.[0];
  if (!wabaId) throw new WhatsappApiError('No WhatsApp Business account was shared', 400);
  const numbers = await request<{ data: { id: string }[] }>(`${graph()}/${encodeURIComponent(wabaId)}/phone_numbers?fields=id`, token);
  const phoneNumberId = numbers.data[0]?.id;
  if (!phoneNumberId) throw new WhatsappApiError('That WhatsApp Business account has no phone number', 400);
  return { wabaId, phoneNumberId };
}

/** Makes Meta send this business's customer messages to Hypa's webhook. */
export const subscribeToWebhook = (wabaId: string, token: string) =>
  request<{ success: boolean }>(`${graph()}/${encodeURIComponent(wabaId)}/subscribed_apps`, token, { method: 'POST' });

/** Proves the token can act for this number, and reads the number shown to customers. */
export async function readNumber(phoneNumberId: string, token: string) {
  return request<{ id: string; display_phone_number?: string }>(
    `${graph()}/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number`,
    token,
  );
}

export async function downloadMedia(mediaId: string, token: string): Promise<{ bytes: Buffer; mimeType: string }> {
  const info = await request<{ url: string; mime_type?: string; file_size?: number }>(
    `${graph()}/${encodeURIComponent(mediaId)}`,
    token,
  );
  const trusted = info.url.startsWith('https://') || (!!process.env.WHATSAPP_GRAPH_URL?.trim() && info.url.startsWith(`${graphHost()}/`));
  if (!trusted) throw new WhatsappApiError('WhatsApp media link is not https', 502);
  if ((info.file_size ?? 0) > MAX_MEDIA_BYTES) throw new WhatsappApiError('WhatsApp media is too large', 413);
  const response = await fetch(info.url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new WhatsappApiError(`WhatsApp media download failed (${response.status})`, response.status);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_MEDIA_BYTES) throw new WhatsappApiError('WhatsApp media is too large', 413);
  return { bytes, mimeType: info.mime_type ?? response.headers.get('content-type') ?? 'application/octet-stream' };
}

export async function uploadMedia(phoneNumberId: string, token: string, bytes: Buffer, mimeType: string): Promise<string> {
  const form = new FormData();
  form.set('messaging_product', 'whatsapp');
  form.set('type', mimeType);
  form.set('file', new Blob([new Uint8Array(bytes)], { type: mimeType }), 'reply');
  const uploaded = await request<{ id: string }>(`${graph()}/${phoneNumberId}/media`, token, { method: 'POST', body: form });
  return uploaded.id;
}

export const sendText = (phoneNumberId: string, token: string, to: string, body: string) =>
  send(phoneNumberId, token, { to, type: 'text', text: { body, preview_url: false } });

export const sendAudio = (phoneNumberId: string, token: string, to: string, mediaId: string) =>
  send(phoneNumberId, token, { to, type: 'audio', audio: { id: mediaId } });

export const sendImage = (phoneNumberId: string, token: string, to: string, mediaId: string) =>
  send(phoneNumberId, token, { to, type: 'image', image: { id: mediaId } });

/** The only kind of message WhatsApp lets a business start after the 24-hour window has closed. */
export const sendTemplate = (phoneNumberId: string, token: string, to: string, template: { name: string; language: string }) =>
  send(phoneNumberId, token, { to, type: 'template', template: { name: template.name, language: { code: template.language } } });

import { api, apiGet, apiPost } from '@/api';
import type { Weekday } from '@/lib/bridge';

/** Hypa Bridge: the owner's side of the WhatsApp business assistant. */

export interface BridgeProfile {
  name: string;
  sells: string;
  currency: string;
  priceList: { name: string; price: number }[];
  /** The days the business is open, with 24-hour times like "09:00". Days left out are closed. */
  hours?: { day: Weekday; open: string; close: string }[];
  languages: string[];
  tone?: string;
}

export interface BridgeNumber {
  id: string;
  phoneNumberId: string;
  displayPhone: string | null;
  profile: BridgeProfile;
  autoReply: boolean;
  /** `low_balance` or `profile_incomplete` when the assistant has stopped answering. */
  alert: string | null;
}

export interface BridgeThreadSummary {
  id: string;
  customerName: string | null;
  mode: 'agent' | 'owner';
  updatedAt: string;
  pendingDrafts: number;
  needsOwner: boolean;
  hasOrder: boolean;
}

export interface BridgeOrderLine {
  name: string;
  qty: number;
  size?: string;
  color?: string;
  unitPrice?: number;
}

export interface BridgeOrder {
  items: BridgeOrderLine[];
  dueDate?: string;
  notes: string;
  missing: string[];
}

export interface BridgeDraft {
  id: string;
  status: 'pending' | 'template_sent';
  text: string;
  hasAudio: boolean;
  images: number;
  order: BridgeOrder | null;
  needsOwner: boolean;
  priceWarning: boolean;
  reason: string | null;
}

export interface BridgeThread {
  id: string;
  customerName: string | null;
  mode: 'agent' | 'owner';
  order: BridgeOrder | null;
  messages: { id: string; role: string; content: string; createdAt: string }[];
  drafts: BridgeDraft[];
}

export const getBridgeNumber = () => apiGet<BridgeNumber | null>('/v2/whatsapp/number');

export const connectBridgeNumber = (input: { phoneNumberId: string; accessToken: string; profile: BridgeProfile; autoReply: boolean }) =>
  apiPost<BridgeNumber>('/v2/whatsapp/number', input);

/** `url` is null until the Meta app is set up for Embedded Signup. */
export const getBridgeSignup = () => apiGet<{ url: string | null; redirectUri: string }>('/v2/whatsapp/signup');

export const connectBridgeWithMeta = (input: { code: string; profile: BridgeProfile; autoReply: boolean }) =>
  apiPost<BridgeNumber>('/v2/whatsapp/number/meta', input);

export const updateBridgeNumber =async (input: { profile?: BridgeProfile; autoReply?: boolean }) =>
  (await api.patch<BridgeNumber>('/v2/whatsapp/number', input)).data;

export const getBridgeThreads = () => apiGet<BridgeThreadSummary[]>('/v2/whatsapp/threads');

export const getBridgeThread = (id: string) => apiGet<BridgeThread>(`/v2/whatsapp/threads/${encodeURIComponent(id)}`);

export const setBridgeMode = (id: string, mode: 'agent' | 'owner') =>
  apiPost<{ mode: string }>(`/v2/whatsapp/threads/${encodeURIComponent(id)}/mode`, { mode });

export const replyInBridgeThread = (id: string, text: string) =>
  apiPost<{ sent: boolean }>(`/v2/whatsapp/threads/${encodeURIComponent(id)}/reply`, { text });

export const sendBridgeDraft = (id: string, text?: string) =>
  apiPost<{ status: string }>(`/v2/whatsapp/drafts/${encodeURIComponent(id)}/send`, text === undefined ? {} : { text });

export const discardBridgeDraft = (id: string) => apiPost<{ discarded: boolean }>(`/v2/whatsapp/drafts/${encodeURIComponent(id)}/discard`);

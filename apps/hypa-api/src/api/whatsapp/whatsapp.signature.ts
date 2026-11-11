import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Checks Meta's `X-Hub-Signature-256` header ("sha256=<hex>") against the exact
 * bytes Meta sent. It must run on the raw body, before anything is parsed.
 */
export function verifyMetaSignature(
  rawBody: Buffer | undefined,
  header: string | undefined,
  appSecret: string | undefined,
): boolean {
  if (!rawBody || !header || !appSecret) return false;
  const match = /^sha256=([0-9a-f]{64})$/i.exec(header.trim());
  if (!match) return false;
  const expected = createHmac('sha256', appSecret).update(rawBody).digest();
  return timingSafeEqual(Buffer.from(match[1], 'hex'), expected);
}

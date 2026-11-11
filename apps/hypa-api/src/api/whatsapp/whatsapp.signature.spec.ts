import { createHmac } from 'node:crypto';
import { verifyMetaSignature } from './whatsapp.signature';

const secret = 'app-secret';
const body = Buffer.from('{"object":"whatsapp_business_account"}');
const sign = (bytes: Buffer, key = secret) => `sha256=${createHmac('sha256', key).update(bytes).digest('hex')}`;

describe('verifyMetaSignature', () => {
  it('accepts the signature of the exact bytes', () => {
    expect(verifyMetaSignature(body, sign(body), secret)).toBe(true);
  });

  it('rejects a body that changed by one byte', () => {
    expect(verifyMetaSignature(Buffer.from('{"object":"whatsapp_business_accounT"}'), sign(body), secret)).toBe(false);
  });

  it('rejects a signature made with another secret', () => {
    expect(verifyMetaSignature(body, sign(body, 'other'), secret)).toBe(false);
  });

  it.each([undefined, '', 'sha256=', 'sha256=zz', `sha1=${'a'.repeat(40)}`, sign(body).slice(7)])(
    'rejects a missing or malformed header (%s)',
    (header) => {
      expect(verifyMetaSignature(body, header, secret)).toBe(false);
    },
  );

  it('rejects everything when the secret or the raw body is missing', () => {
    expect(verifyMetaSignature(body, sign(body), undefined)).toBe(false);
    expect(verifyMetaSignature(body, sign(body), '')).toBe(false);
    expect(verifyMetaSignature(undefined, sign(body), secret)).toBe(false);
  });
});

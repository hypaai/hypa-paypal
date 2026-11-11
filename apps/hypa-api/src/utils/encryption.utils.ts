import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt,
} from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is not defined');
}

const getKey = async () => {
  return (await scryptAsync(ENCRYPTION_KEY, 'salt', 32)) as Buffer;
};

/**
 * Encrypts a string using AES-256-GCM
 * Returns base64 string containing: iv + authTag + ciphertext
 */
export const encryptString = async (data: string) => {
  const key = await getKey();
  const iv = randomBytes(12); // 12-byte IV is recommended for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(data, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16-byte authentication tag

  // Combine iv + authTag + ciphertext for storage
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
};

/**
 * Decrypts a base64 string encrypted by AES-256-GCM
 */
export const decryptString = async (data: string) => {
  const key = await getKey();
  const raw = Buffer.from(data, 'base64');

  const iv = raw.slice(0, 12); // first 12 bytes = IV
  const authTag = raw.slice(12, 28); // next 16 bytes = auth tag
  const encryptedText = raw.slice(28); // rest = ciphertext

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
};

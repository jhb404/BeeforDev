import { safeStorage } from 'electron';
import { logger } from './logger';

const MAGIC = Buffer.from('BFRENC1\0', 'utf-8'); // 8 bytes header marking encrypted blob

function hasMagic(buf: Buffer): boolean {
  return buf.length >= MAGIC.length && buf.subarray(0, MAGIC.length).equals(MAGIC);
}

export function encryptSessionString(plaintext: string): Buffer {
  if (!safeStorage.isEncryptionAvailable()) {
    logger.warn('safeStore: encryption unavailable, writing plaintext fallback');
    return Buffer.from(plaintext, 'utf-8');
  }
  const encrypted = safeStorage.encryptString(plaintext);
  return Buffer.concat([MAGIC, encrypted]);
}

export function decryptSessionBuffer(buf: Buffer): string {
  if (hasMagic(buf)) {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('safeStore: encrypted blob found but encryption unavailable on this host');
    }
    return safeStorage.decryptString(buf.subarray(MAGIC.length));
  }
  // Legacy plaintext file — accept on read; next persist will re-encrypt.
  return buf.toString('utf-8');
}

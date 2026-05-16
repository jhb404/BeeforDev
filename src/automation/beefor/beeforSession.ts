import fs from 'node:fs/promises';
import type { BrowserContext } from 'playwright';
import { logger } from '../../main/logger';
import { decryptSessionBuffer, encryptSessionString } from '../../main/safeStore';

export async function loadStorageStateIfExists(filePath: string) {
  try {
    const buf = await fs.readFile(filePath);
    const raw = decryptSessionBuffer(buf);
    return JSON.parse(raw);
  } catch (err: any) {
    if (err?.code !== 'ENOENT') {
      logger.warn(`beefor: failed to load storage state: ${err?.message}`);
    }
    return undefined;
  }
}

export async function persistStorageState(
  context: BrowserContext,
  filePath: string,
): Promise<void> {
  try {
    const state = await context.storageState();
    const out = encryptSessionString(JSON.stringify(state));
    await fs.writeFile(filePath, out);
    logger.info('Storage state persisted (encrypted)');
  } catch (err) {
    logger.error('Failed to persist storage state', err);
  }
}

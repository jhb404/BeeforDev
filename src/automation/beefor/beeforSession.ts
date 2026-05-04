import fs from 'node:fs/promises';
import type { BrowserContext } from 'playwright';
import { logger } from '../../main/logger';

export async function loadStorageStateIfExists(filePath: string) {
  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    return undefined;
  }
}

export async function persistStorageState(
  context: BrowserContext,
  filePath: string,
): Promise<void> {
  try {
    await context.storageState({ path: filePath });
    logger.info('Storage state persisted');
  } catch (err) {
    logger.error('Failed to persist storage state', err);
  }
}

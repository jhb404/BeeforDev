import type { BrowserWindow } from 'electron';
import type { Page } from 'playwright';
import { BeeforClient } from '../../automation/beefor/beeforClient';
import { withPageLock } from '../../automation/beefor/pageLock';
import { ensureSessionForAction, forceReconnect } from '../sessionGuard';
import { logger } from '../logger';

const SESSION_STALE_REGEX = /Sess(ão|ao)|expirou|expirada|sess|timeout/i;

/**
 * Ensures session, runs `action` under the page lock. No retry.
 */
export async function runBeeforAction<T>(
  win: BrowserWindow | null,
  action: (page: Page) => Promise<T>,
): Promise<T> {
  await ensureSessionForAction(win);
  return withPageLock(async () => {
    const page = await BeeforClient.instance().getPage();
    return action(page);
  });
}

/**
 * Same as `runBeeforAction` but retries once if the error message matches
 * a stale-session pattern (forces a reconnect first). `label` is used in logs.
 */
export async function runBeeforActionWithReconnect<T>(
  win: BrowserWindow | null,
  label: string,
  action: (page: Page) => Promise<T>,
): Promise<T> {
  await ensureSessionForAction(win);
  const exec = () =>
    withPageLock(async () => {
      const page = await BeeforClient.instance().getPage();
      return action(page);
    });

  try {
    return await exec();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!SESSION_STALE_REGEX.test(msg)) throw err;
    logger.warn(`${label}: session stale, reconnecting and retrying`);
    await forceReconnect(win);
    return exec();
  }
}

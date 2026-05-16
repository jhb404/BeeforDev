import { BrowserWindow } from 'electron';
import { BeeforClient } from '../automation/beefor/beeforClient';
import { performLogin, doVerifySession, warmKudoRecipientCache } from '../automation/beefor/actions';
import { withPageLock } from '../automation/beefor/pageLock';
import { logger } from './logger';
import { sessionExists, sessionPath } from './sessionStore';
import { getCredentials } from './secureStorage';
import { emitStatus, getCurrentStatus } from './statusBus';
import type { SessionStatus } from '../shared/types/index';

const VERIFY_INTERVAL_MS = 60_000; // 1 min watchdog

let watchdogTimer: NodeJS.Timeout | null = null;
let inFlight: Promise<SessionStatus> | null = null;

/**
 * Ensures session is valid; reconnects silently if not.
 * De-duplicates concurrent calls.
 */
export function ensureSession(
  win: BrowserWindow | null,
  opts: { announceReconnect?: boolean } = {},
): Promise<SessionStatus> {
  if (inFlight) return inFlight;
  inFlight = run(win, opts).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function run(
  win: BrowserWindow | null,
  opts: { announceReconnect?: boolean },
): Promise<SessionStatus> {
  const client = BeeforClient.instance();
  const before = getCurrentStatus();

  // Trust cached "connected" — skip work + don't emit so UI stays enabled.
  if (before === 'connected') {
    return 'connected';
  }

  // Reached only when before !== 'connected' — ignore announceReconnect.
  void opts;
  emitStatus(win, 'loading');

  try {
    return await withPageLock(async () => {
      const exists = await sessionExists();
      if (exists) {
        const page = await client.getPage(sessionPath());
        if (await doVerifySession(page)) {
          emitStatus(win, 'connected');
          void warmKudoRecipientCache(page);
          return 'connected';
        }
        logger.warn('Saved session invalid — silent re-login');
      } else {
        logger.info('No saved session — silent login');
      }

      const creds = await getCredentials();
      if (!creds) {
        emitStatus(win, 'disconnected');
        logger.info('No credentials saved — open Configurações');
        return 'disconnected';
      }

      const page = await client.getPage();
      await performLogin(page, creds);
      await client.persistSession(sessionPath());
      emitStatus(win, 'connected');
      void warmKudoRecipientCache(page);
      return 'connected';
    });
  } catch (err) {
    logger.error('ensureSession failed', err);
    emitStatus(win, 'expired');
    return 'expired';
  }
}

export function startWatchdog(getWin: () => BrowserWindow | null) {
  stopWatchdog();
  watchdogTimer = setInterval(async () => {
    const status = getCurrentStatus();
    if (status !== 'connected') return;
    try {
      const ok = await withPageLock(async () => {
        const client = BeeforClient.instance();
        const page = await client.getPage(sessionPath());
        return doVerifySession(page);
      });
      if (!ok) {
        logger.warn('Watchdog: session lost — reconnecting');
        await ensureSession(getWin(), { announceReconnect: true });
      }
    } catch (err) {
      logger.error('Watchdog check failed', err);
    }
  }, VERIFY_INTERVAL_MS);
}

export function stopWatchdog() {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
}

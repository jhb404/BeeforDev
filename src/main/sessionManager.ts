import { BrowserWindow } from 'electron';
import { logger } from './logger';
import { getCredentials } from './secureStorage';
import { emitStatus, getCurrentStatus } from './statusBus';
import type { SessionStatus } from '../shared/types/index';
import {
  getValidSession,
  loginHttp,
  getCachedSession,
  clearCachedSession,
} from './services/beeforHttpClient';

const VERIFY_INTERVAL_MS = 60_000; // 1 min watchdog

let watchdogTimer: NodeJS.Timeout | null = null;
let inFlight: Promise<SessionStatus> | null = null;

/**
 * Garante sessão HTTP válida; reconecta silencioso se preciso. Dedup concorrente.
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
  const before = getCurrentStatus();
  if (before === 'connected') return 'connected';

  void opts;
  emitStatus(win, 'loading');

  if (getCachedSession()) {
    emitStatus(win, 'connected');
    return 'connected';
  }

  const creds = await getCredentials();
  if (!creds) {
    emitStatus(win, 'disconnected');
    logger.info('Sem credenciais — abrir Configurações.');
    return 'disconnected';
  }

  try {
    await loginHttp(creds.email, creds.password);
    emitStatus(win, 'connected');
    logger.info('Sessão HTTP estabelecida.');
    return 'connected';
  } catch (err) {
    logger.error(`Login HTTP falhou: ${err instanceof Error ? err.message : String(err)}`);
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
      await getValidSession();
    } catch {
      clearCachedSession();
      logger.warn('Watchdog: sessão perdida — reconectando');
      await ensureSession(getWin(), { announceReconnect: true });
    }
  }, VERIFY_INTERVAL_MS);
}

export function stopWatchdog() {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
}

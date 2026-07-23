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
  BeeforAuthError,
} from './services/beeforHttpClient';

const VERIFY_INTERVAL_MS = 60_000; // 1 min watchdog
const LOGIN_MAX_ATTEMPTS = 3; // auto-tenta 3x antes de expor "Reconectar"
const LOGIN_RETRY_DELAY_MS = 1_500;

let watchdogTimer: NodeJS.Timeout | null = null;
let inFlight: Promise<SessionStatus> | null = null;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    // Sem senha: pode ser sessão Google. Tenta restaurar via token persistido
    // (getValidSession → refreshSession → LoginComToken).
    try {
      await getValidSession();
      emitStatus(win, 'connected');
      logger.info('Sessão Google restaurada via token.');
      return 'connected';
    } catch {
      emitStatus(win, 'disconnected');
      logger.info('Sem credenciais — abrir Configurações.');
      return 'disconnected';
    }
  }

  // Auto-retry: tenta logar algumas vezes antes de mostrar "Reconectar".
  // Falhas transitórias de rede (fetch failed) não devem parar o app na 1ª.
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= LOGIN_MAX_ATTEMPTS; attempt++) {
    try {
      await loginHttp(creds.email, creds.password);
      emitStatus(win, 'connected');
      logger.info(`Sessão HTTP estabelecida (tentativa ${attempt}/${LOGIN_MAX_ATTEMPTS}).`);
      return 'connected';
    } catch (err) {
      lastErr = err;
      logger.error(
        `Login HTTP falhou (tentativa ${attempt}/${LOGIN_MAX_ATTEMPTS}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      // Credencial errada não melhora com retry — para na hora.
      if (err instanceof BeeforAuthError) break;
      if (attempt < LOGIN_MAX_ATTEMPTS) {
        emitStatus(win, 'reconnecting');
        await delay(LOGIN_RETRY_DELAY_MS);
      }
    }
  }

  logger.error(
    `Login HTTP esgotou ${LOGIN_MAX_ATTEMPTS} tentativas: ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`,
  );
  emitStatus(win, 'expired');
  return 'expired';
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

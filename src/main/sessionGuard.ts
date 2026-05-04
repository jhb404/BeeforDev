import type { BrowserWindow } from 'electron';
import { ensureSession } from './sessionManager';

/**
 * Called before any user action. Auto-reconnects if session expired.
 * Throws if no credentials available so the action handler returns a clean error.
 */
export async function ensureSessionForAction(
  win: BrowserWindow | null,
): Promise<void> {
  const status = await ensureSession(win, { announceReconnect: true });
  if (status !== 'connected') {
    throw new Error(
      status === 'disconnected'
        ? 'Credenciais não configuradas. Abra Configurações.'
        : 'Sessão indisponível. Tente novamente em alguns segundos.',
    );
  }
}

import type { BrowserWindow } from 'electron';
import { IPC } from '../../../shared/ipc/index';
import { emitStatus, getCurrentStatus } from '../../statusBus';
import { getCredentials } from '../../secureStorage';
import { clearSession } from '../../sessionStore';
import { ok } from '../../../shared/result';
import { defineHandler } from '../defineHandler';
import {
  loginHttp,
  clearCachedSession,
  clearCredentials as clearHttpCreds,
  getValidSession,
} from '../../services/beeforHttpClient';
import { logger } from '../../logger';

export function registerSessionHandlers(getWindow: () => BrowserWindow | null) {
  defineHandler({
    channel: IPC.SESSION_STATUS,
    errorMessage: 'Session status failed',
    run: () => getCurrentStatus(),
  });

  defineHandler({
    channel: IPC.SESSION_LOGIN,
    errorMessage: 'Login failed',
    onError: () => emitStatus(getWindow(), 'error'),
    run: async () => {
      const win = getWindow();
      emitStatus(win, 'loading');
      const creds = await getCredentials();
      if (!creds) throw new Error('Credenciais não configuradas. Abra Configurações.');
      await loginHttp(creds.email, creds.password);
      logger.info('Login HTTP concluído.');
      emitStatus(win, 'connected');
      return ok();
    },
  });

  defineHandler({
    channel: IPC.SESSION_LOGOUT,
    errorMessage: 'Logout failed',
    run: async () => {
      const win = getWindow();
      await clearSession().catch(() => null);
      clearCachedSession();
      clearHttpCreds();
      const { invalidateRecipientCache } = await import('../../services/beeforPessoaService');
      await invalidateRecipientCache().catch(() => null);
      const { invalidateStreakCache } = await import('../../services/beeforMoodService');
      await invalidateStreakCache().catch(() => null);
      emitStatus(win, 'disconnected');
      return ok();
    },
  });

  defineHandler({
    channel: IPC.SESSION_VERIFY,
    errorMessage: 'Verify session failed',
    onError: () => emitStatus(getWindow(), 'error'),
    run: async () => {
      const win = getWindow();
      emitStatus(win, 'loading');
      try {
        await getValidSession();
        emitStatus(win, 'connected');
        return ok('connected');
      } catch {
        clearCachedSession();
        emitStatus(win, 'expired');
        return ok('expired');
      }
    },
  });
}

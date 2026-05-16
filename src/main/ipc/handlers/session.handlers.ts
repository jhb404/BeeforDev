import type { BrowserWindow } from 'electron';
import { IPC } from '../../../shared/ipc/index';
import { BeeforClient } from '../../../automation/beefor/beeforClient';
import { doLogout, doVerifySession, performLogin } from '../../../automation/beefor/actions';
import { withPageLock } from '../../../automation/beefor/pageLock';
import { emitStatus, getCurrentStatus } from '../../statusBus';
import { getCredentials } from '../../secureStorage';
import { clearSession, sessionPath } from '../../sessionStore';
import { ok } from '../../../shared/result';
import { defineHandler } from '../defineHandler';

export function registerSessionHandlers(getWindow: () => BrowserWindow | null) {
  const client = BeeforClient.instance();

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
      await withPageLock(async () => {
        const creds = await getCredentials();
        if (!creds) throw new Error('Credenciais não configuradas. Abra Configurações.');
        const page = await client.getPage();
        await performLogin(page, creds);
        await client.persistSession(sessionPath());
      });
      emitStatus(win, 'connected');
      return ok();
    },
  });

  defineHandler({
    channel: IPC.SESSION_LOGOUT,
    errorMessage: 'Logout failed',
    run: async () => {
      const win = getWindow();
      await withPageLock(async () => {
        const page = await client.getPage().catch(() => null);
        if (page) await doLogout(page);
        await clearSession();
        await client.close();
      });
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
      const isLogged = await withPageLock(async () => {
        const page = await client.getPage();
        return doVerifySession(page);
      });
      const next = isLogged ? 'connected' : 'expired';
      emitStatus(win, next);
      return ok(next);
    },
  });
}

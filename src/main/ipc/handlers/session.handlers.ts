import { BrowserWindow, ipcMain } from 'electron';
import { IPC } from '../../../shared/ipc';
import { BeeforClient } from '../../../automation/beefor/beeforClient';
import { doLogout, doVerifySession, performLogin } from '../../../automation/beefor/beeforActions';
import { withPageLock } from '../../../automation/beefor/pageLock';
import { emitStatus, getCurrentStatus } from '../../statusBus';
import { getCredentials } from '../../secureStorage';
import { clearSession, sessionPath } from '../../sessionStore';
import { logger } from '../../logger';
import { ok, fail } from '../../services/result';

export function registerSessionHandlers(getWindow: () => BrowserWindow | null) {
  const client = BeeforClient.instance();

  ipcMain.handle(IPC.SESSION_STATUS, async () => getCurrentStatus());

  ipcMain.handle(IPC.SESSION_LOGIN, async () => {
    const win = getWindow();
    emitStatus(win, 'loading');
    try {
      await withPageLock(async () => {
        const creds = await getCredentials();
        if (!creds) throw new Error('Credenciais não configuradas. Abra Configurações.');
        const page = await client.getPage();
        await performLogin(page, creds);
        await client.persistSession(sessionPath());
      });
      emitStatus(win, 'connected');
      return ok();
    } catch (err) {
      logger.error('Login failed', err);
      emitStatus(win, 'error');
      return fail(err);
    }
  });

  ipcMain.handle(IPC.SESSION_LOGOUT, async () => {
    const win = getWindow();
    try {
      await withPageLock(async () => {
        const page = await client.getPage().catch(() => null);
        if (page) await doLogout(page);
        await clearSession();
        await client.close();
      });
      emitStatus(win, 'disconnected');
      return ok();
    } catch (err) {
      logger.error('Logout failed', err);
      return fail(err);
    }
  });

  ipcMain.handle(IPC.SESSION_VERIFY, async () => {
    const win = getWindow();
    emitStatus(win, 'loading');
    try {
      const isLogged = await withPageLock(async () => {
        const page = await client.getPage();
        return doVerifySession(page);
      });
      const next = isLogged ? 'connected' : 'expired';
      emitStatus(win, next);
      return ok(next);
    } catch (err) {
      logger.error('Verify session failed', err);
      emitStatus(win, 'error');
      return fail(err);
    }
  });
}

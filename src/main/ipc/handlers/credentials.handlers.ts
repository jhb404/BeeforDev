import { ipcMain } from 'electron';
import { IPC } from '../../../shared/ipc';
import type { Credentials } from '../../../shared/types';
import { clearCredentials, getCredentials, saveCredentials } from '../../secureStorage';
import { ok, fail } from '../../services/result';

export function registerCredentialsHandlers() {
  ipcMain.handle(IPC.CREDS_SAVE, async (_e, creds: Credentials) => {
    try {
      await saveCredentials(creds);
      return ok();
    } catch (err) {
      return fail(err);
    }
  });

  ipcMain.handle(IPC.CREDS_GET, async () => {
    const c = await getCredentials();
    return c ? { email: c.email } : null;
  });

  ipcMain.handle(IPC.CREDS_CLEAR, async () => {
    try {
      await clearCredentials();
      return ok();
    } catch (err) {
      return fail(err);
    }
  });
}

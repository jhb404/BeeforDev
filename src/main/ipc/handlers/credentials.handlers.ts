import { ipcMain } from 'electron';
import { IPC } from '../../../shared/ipc';
import { clearCredentials, getCredentials, saveCredentials } from '../../secureStorage';
import { ok, fail } from '../../services/result';
import { credentialsSchema } from '../schemas';
import { validate } from '../validate';

export function registerCredentialsHandlers() {
  ipcMain.handle(IPC.CREDS_SAVE, async (_e, payload: unknown) => {
    const parsed = validate(credentialsSchema, payload);
    if (!parsed.ok) return parsed.result;
    try {
      await saveCredentials(parsed.data);
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

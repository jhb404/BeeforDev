import { BrowserWindow, ipcMain } from 'electron';
import { IPC } from '../../../shared/ipc';
import { doGetCurrentMood, doSelectMood } from '../../../automation/beefor/beeforActions';
import { logger } from '../../logger';
import { ok, fail } from '../../services/result';
import { runBeeforActionWithReconnect } from '../../services/beeforActionRunner';
import { moodSchema } from '../schemas';
import { validate } from '../validate';

export function registerMoodHandlers(getWindow: () => BrowserWindow | null) {
  ipcMain.handle(IPC.ACTION_SELECT_MOOD, async (_e, payload: unknown) => {
    const parsed = validate(moodSchema, payload);
    if (!parsed.ok) return parsed.result;
    const win = getWindow();
    try {
      await runBeeforActionWithReconnect(win, 'Select mood', (page) =>
        doSelectMood(page, parsed.data),
      );
      return ok();
    } catch (err) {
      logger.error('Select mood failed', err);
      return fail(err);
    }
  });

  ipcMain.handle(IPC.ACTION_GET_CURRENT_MOOD, async () => {
    const win = getWindow();
    try {
      const mood = await runBeeforActionWithReconnect(win, 'Get current mood', (page) =>
        doGetCurrentMood(page),
      );
      return ok(mood);
    } catch (err) {
      logger.error('Get current mood failed', err);
      return fail(err);
    }
  });
}

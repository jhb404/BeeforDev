import { BrowserWindow, ipcMain } from 'electron';
import { IPC } from '../../../shared/ipc';
import type { Mood } from '../../../shared/types';
import { doGetCurrentMood, doSelectMood } from '../../../automation/beefor/beeforActions';
import { logger } from '../../logger';
import { ok, fail } from '../../services/result';
import { runBeeforActionWithReconnect } from '../../services/beeforActionRunner';

export function registerMoodHandlers(getWindow: () => BrowserWindow | null) {
  ipcMain.handle(IPC.ACTION_SELECT_MOOD, async (_e, mood: Mood) => {
    const win = getWindow();
    try {
      await runBeeforActionWithReconnect(win, 'Select mood', (page) => doSelectMood(page, mood));
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

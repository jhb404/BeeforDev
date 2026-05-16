import type { BrowserWindow } from 'electron';
import { IPC } from '../../../shared/ipc/index';
import { doGetCurrentMood, doSelectMood } from '../../../automation/beefor/actions';
import { ok } from '../../../shared/result';
import { runBeeforActionWithReconnect } from '../../services/beeforActionRunner';
import { moodSchema } from '../schemas';
import { defineHandler } from '../defineHandler';

export function registerMoodHandlers(getWindow: () => BrowserWindow | null) {
  defineHandler({
    channel: IPC.ACTION_SELECT_MOOD,
    schema: moodSchema,
    errorMessage: 'Select mood failed',
    run: async ({ data }) => {
      const win = getWindow();
      await runBeeforActionWithReconnect(win, 'Select mood', (page) => doSelectMood(page, data));
      return ok();
    },
  });

  defineHandler({
    channel: IPC.ACTION_GET_CURRENT_MOOD,
    errorMessage: 'Get current mood failed',
    run: async () => {
      const win = getWindow();
      const mood = await runBeeforActionWithReconnect(win, 'Get current mood', (page) =>
        doGetCurrentMood(page),
      );
      return ok(mood);
    },
  });
}

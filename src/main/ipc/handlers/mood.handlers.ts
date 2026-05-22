import type { BrowserWindow } from 'electron';
import { IPC } from '../../../shared/ipc/index';
import { ok } from '../../../shared/result';
import { addMood, getCurrentMood } from '../../services/beeforMoodService';
import { moodSchema } from '../schemas';
import { defineHandler } from '../defineHandler';

export function registerMoodHandlers(_getWindow: () => BrowserWindow | null) {
  defineHandler({
    channel: IPC.ACTION_SELECT_MOOD,
    schema: moodSchema,
    errorMessage: 'Select mood failed',
    run: async ({ data }) => {
      await addMood(data);
      return ok();
    },
  });

  defineHandler({
    channel: IPC.ACTION_GET_CURRENT_MOOD,
    errorMessage: 'Get current mood failed',
    run: async () => {
      const res = await getCurrentMood();
      return ok(res.mood);
    },
  });
}

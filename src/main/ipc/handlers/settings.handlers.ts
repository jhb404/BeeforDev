import { ipcMain } from 'electron';
import { IPC } from '../../../shared/ipc';
import type { AppSettings } from '../../../shared/types';
import { loadSettings, saveSettings } from '../../sessionStore';
import { setAutoStart } from '../../autoStart';
import { ok, fail } from '../../services/result';

export function registerSettingsHandlers() {
  ipcMain.handle(IPC.SETTINGS_GET, async () => loadSettings());

  ipcMain.handle(IPC.SETTINGS_SET, async (_e, s: AppSettings) => {
    try {
      await saveSettings(s);
      setAutoStart(s.autoStart);
      return ok();
    } catch (err) {
      return fail(err);
    }
  });
}

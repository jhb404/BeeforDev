import { IPC } from '../../../shared/ipc/index';
import { loadSettings, saveSettings } from '../../sessionStore';
import { setAutoStart } from '../../autoStart';
import { rebuildTrayMenu } from '../../bootstrap/tray';
import { ok } from '../../../shared/result';
import { settingsSchema } from '../schemas';
import { defineHandler } from '../defineHandler';

export function registerSettingsHandlers() {
  defineHandler({
    channel: IPC.SETTINGS_GET,
    errorMessage: 'Get settings failed',
    run: () => loadSettings(),
  });

  defineHandler({
    channel: IPC.SETTINGS_SET,
    schema: settingsSchema,
    errorMessage: 'Set settings failed',
    run: async ({ data }) => {
      await saveSettings(data);
      setAutoStart(data.autoStart);
      void rebuildTrayMenu();
      return ok();
    },
  });
}

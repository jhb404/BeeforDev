import type { ActionResult, AppSettings } from '@shared/types';
import type { BeeforApi } from '../../../main/preload';

export function createSettingsClient(api: BeeforApi) {
  return {
    get: (): Promise<AppSettings> => api.getSettings(),
    set: (s: AppSettings): Promise<ActionResult> => api.setSettings(s),
  };
}

export const settingsClient = createSettingsClient(window.beefor);
export type SettingsClient = ReturnType<typeof createSettingsClient>;

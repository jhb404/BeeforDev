import type { ActionResult, AppSettings } from '@shared/types';

export const settingsClient = {
  get: (): Promise<AppSettings> => window.beefor.getSettings(),
  set: (s: AppSettings): Promise<ActionResult> => window.beefor.setSettings(s),
};

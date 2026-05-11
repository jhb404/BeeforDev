import type { ActionResult, TodayAlert } from '../../../shared/types';

export const systemClient = {
  getAdminStatus: (): Promise<{ elevated: boolean; platform: string }> =>
    window.beefor.getAdminStatus(),
  relaunchAsAdmin: (): Promise<ActionResult> => window.beefor.relaunchAsAdmin(),
  relaunchApp: (): Promise<ActionResult> => window.beefor.relaunchApp(),
  testNotification: (
    kind: 'mood' | 'lunch' | 'kudocard' | 'punch',
  ): Promise<ActionResult> => window.beefor.testNotification(kind),
  getTodayAlerts: (): Promise<ActionResult<TodayAlert[]>> =>
    window.beefor.getTodayAlerts(),
  onPlayAlarm: (cb: (info: { title: string; body: string }) => void): (() => void) =>
    window.beefor.onPlayAlarm(cb),
  onNotify: (cb: (info: { title: string; body: string }) => void): (() => void) =>
    window.beefor.onNotify(cb),
  getAssetPath: (): Promise<string> => window.beefor.getAssetPath(),
  readAsset: (fileName: string): Promise<string | null> =>
    window.beefor.readAsset(fileName),
};

export const windowClient = {
  minimize: () => window.beefor.winMinimize(),
  maximize: () => window.beefor.winMaximize(),
  close: () => window.beefor.winClose(),
};

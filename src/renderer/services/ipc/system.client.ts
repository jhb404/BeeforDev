import type { ActionResult, TodayAlert } from '@shared/types/index';
import type { BeeforApi } from '../../../main/preload';

type AlarmInfo = { title: string; body: string; kind?: Exclude<TodayAlert['kind'], 'birthday'> };

export function createSystemClient(api: BeeforApi) {
  return {
    getAdminStatus: (): Promise<{ elevated: boolean; platform: string }> => api.getAdminStatus(),
    relaunchAsAdmin: (): Promise<ActionResult> => api.relaunchAsAdmin(),
    relaunchApp: (): Promise<ActionResult> => api.relaunchApp(),
    testNotification: (kind: 'mood' | 'lunch' | 'kudocard' | 'punch'): Promise<ActionResult> =>
      api.testNotification(kind),
    getTodayAlerts: (): Promise<ActionResult<TodayAlert[]>> => api.getTodayAlerts(),
    onPlayAlarm: (cb: (info: AlarmInfo) => void): (() => void) => api.onPlayAlarm(cb),
    onNotify: (cb: (info: { title: string; body: string }) => void): (() => void) =>
      api.onNotify(cb),
    onUpdateAvailable: (cb: (info: { version: string }) => void): (() => void) =>
      api.onUpdateAvailable(cb),
    onUpdateDownloaded: (cb: (info: { version: string }) => void): (() => void) =>
      api.onUpdateDownloaded(cb),
    onTrayLunchTimer: (cb: () => void): (() => void) => api.onTrayLunchTimer(cb),
    onTrayOpenKudo: (cb: () => void): (() => void) => api.onTrayOpenKudo(cb),
    onTrayOpenCoins: (cb: () => void): (() => void) => api.onTrayOpenCoins(cb),
    setLunchTimerActive: (active: boolean): void => api.setLunchTimerActive(active),
    quitAndInstallUpdate: (): Promise<void> => api.quitAndInstallUpdate(),
    getAssetPath: (): Promise<string> => api.getAssetPath(),
    readAsset: (fileName: string): Promise<string | null> => api.readAsset(fileName),
    notifyWindows: (title: string, body: string, variant?: 'orange' | 'purple') =>
      api.notifyWindows(title, body, variant),
    pokerGetPort: (): Promise<number> => api.pokerGetPort(),
    pokerGetLocalIp: (): Promise<string> => api.pokerGetLocalIp(),
    pokerStartTunnel: (): Promise<ActionResult<string>> => api.pokerStartTunnel(),
    pokerStopTunnel: (): Promise<ActionResult> => api.pokerStopTunnel(),
    clipboardWrite: (text: string): Promise<ActionResult> => api.clipboardWrite(text),
    consumeDeepLink: (): Promise<string | null> => api.consumeDeepLink(),
    onDeepLink: (cb: (url: string) => void): (() => void) => api.onDeepLink(cb),
  };
}

export function createWindowClient(api: BeeforApi) {
  return {
    minimize: () => api.winMinimize(),
    maximize: () => api.winMaximize(),
    close: () => api.winClose(),
    setIcon: (dataUrl: string) => api.winSetIcon(dataUrl),
  };
}

export const systemClient = createSystemClient(window.beefor);
export const windowClient = createWindowClient(window.beefor);
export type SystemClient = ReturnType<typeof createSystemClient>;
export type WindowClient = ReturnType<typeof createWindowClient>;

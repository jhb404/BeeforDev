import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc';
import type {
  ActionResult,
  AppSettings,
  Credentials,
  FetchedTimesheetRow,
  Mood,
  SessionStatus,
  TimesheetEntry,
  TodayAlert,
} from '../shared/types';

const api = {
  saveCredentials: (creds: Credentials): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.CREDS_SAVE, creds),
  getCredentials: (): Promise<{ email: string } | null> =>
    ipcRenderer.invoke(IPC.CREDS_GET),
  clearCredentials: (): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.CREDS_CLEAR),

  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.SETTINGS_GET),
  setSettings: (s: AppSettings): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.SETTINGS_SET, s),

  getStatus: (): Promise<SessionStatus> =>
    ipcRenderer.invoke(IPC.SESSION_STATUS),
  login: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.SESSION_LOGIN),
  logout: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.SESSION_LOGOUT),
  verifySession: (): Promise<ActionResult<SessionStatus>> =>
    ipcRenderer.invoke(IPC.SESSION_VERIFY),

  autoLancamento: (): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.ACTION_AUTO_LANCAMENTO),
  selectMood: (mood: Mood): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.ACTION_SELECT_MOOD, mood),
  openBeefor: (): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.ACTION_OPEN_BEEFOR),
  lancarHora: (entry: TimesheetEntry): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.ACTION_LANCAR_HORA, entry),
  fetchTimesheet: (
    year: number,
    month: number,
  ): Promise<ActionResult<FetchedTimesheetRow[]>> =>
    ipcRenderer.invoke(IPC.ACTION_FETCH_TIMESHEET, year, month),
  getCurrentMood: (): Promise<ActionResult<string | null>> =>
    ipcRenderer.invoke(IPC.ACTION_GET_CURRENT_MOOD),

  onStatus: (cb: (status: SessionStatus) => void): (() => void) => {
    const listener = (_e: unknown, status: SessionStatus) => cb(status);
    ipcRenderer.on(IPC.EVT_STATUS, listener);
    return () => {
      ipcRenderer.removeListener(IPC.EVT_STATUS, listener);
    };
  },

  // admin / system
  getAdminStatus: (): Promise<{ elevated: boolean; platform: string }> =>
    ipcRenderer.invoke(IPC.ADMIN_STATUS),
  relaunchAsAdmin: (): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.ADMIN_RELAUNCH),

  // notification testing
  testNotification: (
    kind: 'mood' | 'lunch' | 'kudocard' | 'punch',
  ): Promise<ActionResult> => ipcRenderer.invoke(IPC.NOTIFY_TEST, kind),

  getTodayAlerts: (): Promise<ActionResult<TodayAlert[]>> =>
    ipcRenderer.invoke(IPC.ACTION_GET_TODAY_ALERTS),

  onPlayAlarm: (cb: (info: { title: string; body: string }) => void): (() => void) => {
    const listener = (_e: unknown, info: { title: string; body: string }) => cb(info);
    ipcRenderer.on(IPC.EVT_PLAY_ALARM, listener);
    return () => ipcRenderer.removeListener(IPC.EVT_PLAY_ALARM, listener);
  },
  onNotify: (cb: (info: { title: string; body: string }) => void): (() => void) => {
    const listener = (_e: unknown, info: { title: string; body: string }) => cb(info);
    ipcRenderer.on(IPC.EVT_NOTIFY, listener);
    return () => ipcRenderer.removeListener(IPC.EVT_NOTIFY, listener);
  },
};

contextBridge.exposeInMainWorld('beefor', api);

export type BeeforApi = typeof api;

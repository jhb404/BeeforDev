import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc';
import type {
  ActionResult,
  AppSettings,
  Coin2uBuyItemRequest,
  Coin2uCredentials,
  Coin2uDashboard,
  Coin2uLog,
  Coin2uShop,
  Coin2uTransferRequest,
  Credentials,
  FetchedTimesheetRow,
  KudoCardCounts,
  KudoCardDetail,
  KudoCardLists,
  KudoCardRecipientType,
  KudoSearchResult,
  Mood,
  SendKudoCardRequest,
  SendKudoCardResult,
  SessionStatus,
  TeamMember,
  TimesheetEntry,
  TodayAlert,
} from '../shared/types';

const api = {
  saveCredentials: (creds: Credentials): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.CREDS_SAVE, creds),
  getCredentials: (): Promise<{ email: string } | null> => ipcRenderer.invoke(IPC.CREDS_GET),
  clearCredentials: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.CREDS_CLEAR),

  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.SETTINGS_GET),
  setSettings: (s: AppSettings): Promise<ActionResult> => ipcRenderer.invoke(IPC.SETTINGS_SET, s),

  getStatus: (): Promise<SessionStatus> => ipcRenderer.invoke(IPC.SESSION_STATUS),
  login: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.SESSION_LOGIN),
  logout: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.SESSION_LOGOUT),
  verifySession: (): Promise<ActionResult<SessionStatus>> => ipcRenderer.invoke(IPC.SESSION_VERIFY),

  autoLancamento: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.ACTION_AUTO_LANCAMENTO),
  selectMood: (mood: Mood): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.ACTION_SELECT_MOOD, mood),
  openBeefor: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.ACTION_OPEN_BEEFOR),
  lancarHora: (entry: TimesheetEntry): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.ACTION_LANCAR_HORA, entry),
  fetchTimesheet: (year: number, month: number): Promise<ActionResult<FetchedTimesheetRow[]>> =>
    ipcRenderer.invoke(IPC.ACTION_FETCH_TIMESHEET, year, month),
  getCurrentMood: (): Promise<ActionResult<string | null>> =>
    ipcRenderer.invoke(IPC.ACTION_GET_CURRENT_MOOD),
  sendKudoCard: (req: SendKudoCardRequest): Promise<ActionResult<SendKudoCardResult>> =>
    ipcRenderer.invoke(IPC.ACTION_SEND_KUDO_CARD, req),
  searchKudoRecipient: (
    type: KudoCardRecipientType,
    query: string,
  ): Promise<ActionResult<KudoSearchResult[]>> =>
    ipcRenderer.invoke(IPC.ACTION_SEARCH_KUDO_RECIPIENT, type, query),
  getKudoCounts: (): Promise<ActionResult<KudoCardCounts>> =>
    ipcRenderer.invoke(IPC.ACTION_KUDO_COUNTS),
  getKudoLists: (): Promise<ActionResult<KudoCardLists>> =>
    ipcRenderer.invoke(IPC.ACTION_KUDO_LISTS),
  getKudoDetail: (id: string): Promise<ActionResult<KudoCardDetail>> =>
    ipcRenderer.invoke(IPC.ACTION_KUDO_DETAIL, id),

  fetchTeamMembers: (): Promise<ActionResult<TeamMember[]>> =>
    ipcRenderer.invoke(IPC.ACTION_FETCH_TEAM_MEMBERS),

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
  relaunchAsAdmin: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.ADMIN_RELAUNCH),
  relaunchApp: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.APP_RELAUNCH),

  // notification testing
  testNotification: (kind: 'mood' | 'lunch' | 'kudocard' | 'punch'): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.NOTIFY_TEST, kind),

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

  setLunchTimerActive: (active: boolean): void =>
    ipcRenderer.send(IPC.TRAY_SET_LUNCH_ACTIVE, active),

  // Tray → renderer events
  onTrayLunchTimer: (cb: () => void): (() => void) => {
    const listener = () => cb();
    ipcRenderer.on(IPC.EVT_TRAY_LUNCH_TIMER, listener);
    return () => ipcRenderer.removeListener(IPC.EVT_TRAY_LUNCH_TIMER, listener);
  },
  onTrayOpenKudo: (cb: () => void): (() => void) => {
    const listener = () => cb();
    ipcRenderer.on(IPC.EVT_TRAY_OPEN_KUDO, listener);
    return () => ipcRenderer.removeListener(IPC.EVT_TRAY_OPEN_KUDO, listener);
  },
  onTrayOpenCoins: (cb: () => void): (() => void) => {
    const listener = () => cb();
    ipcRenderer.on(IPC.EVT_TRAY_OPEN_COINS, listener);
    return () => ipcRenderer.removeListener(IPC.EVT_TRAY_OPEN_COINS, listener);
  },

  // Updater events
  onUpdateAvailable: (cb: (info: { version: string }) => void): (() => void) => {
    const listener = (_e: unknown, info: { version: string }) => cb(info);
    ipcRenderer.on(IPC.EVT_UPDATE_AVAILABLE, listener);
    return () => ipcRenderer.removeListener(IPC.EVT_UPDATE_AVAILABLE, listener);
  },
  onUpdateDownloaded: (cb: (info: { version: string }) => void): (() => void) => {
    const listener = (_e: unknown, info: { version: string }) => cb(info);
    ipcRenderer.on(IPC.EVT_UPDATE_DOWNLOADED, listener);
    return () => ipcRenderer.removeListener(IPC.EVT_UPDATE_DOWNLOADED, listener);
  },
  quitAndInstallUpdate: (): Promise<void> => ipcRenderer.invoke(IPC.UPDATER_QUIT_AND_INSTALL),

  // Window controls (frameless)
  winMinimize: () => ipcRenderer.send(IPC.WIN_MINIMIZE),
  winMaximize: () => ipcRenderer.send(IPC.WIN_MAXIMIZE),
  winClose: () => ipcRenderer.send(IPC.WIN_CLOSE),
  winSetIcon: (dataUrl: string) => ipcRenderer.send(IPC.WIN_SET_ICON, dataUrl),

  // App info
  getAssetPath: (): Promise<string> => ipcRenderer.invoke(IPC.APP_GET_ASSET_PATH),
  readAsset: (fileName: string): Promise<string | null> =>
    ipcRenderer.invoke(IPC.APP_READ_ASSET, fileName),

  // Coin2U
  saveCoin2uCreds: (payload: { email: string; password: string }): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.COIN2U_SAVE_CREDS, payload),
  getCoin2uCreds: (): Promise<Coin2uCredentials | null> => ipcRenderer.invoke(IPC.COIN2U_GET_CREDS),
  clearCoin2uCreds: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.COIN2U_CLEAR_CREDS),
  getCoin2uDashboard: (): Promise<ActionResult<Coin2uDashboard>> =>
    ipcRenderer.invoke(IPC.COIN2U_GET_DASHBOARD),
  getCoin2uLog: (): Promise<ActionResult<Coin2uLog>> => ipcRenderer.invoke(IPC.COIN2U_GET_LOG),
  getCoin2uShop: (): Promise<ActionResult<Coin2uShop>> => ipcRenderer.invoke(IPC.COIN2U_GET_SHOP),
  buyCoin2uItem: (payload: Coin2uBuyItemRequest): Promise<ActionResult<boolean>> =>
    ipcRenderer.invoke(IPC.COIN2U_BUY_ITEM, payload),
  transferCoin2uCoins: (payload: Coin2uTransferRequest): Promise<ActionResult<boolean>> =>
    ipcRenderer.invoke(IPC.COIN2U_TRANSFER, payload),
  verifyCoin2u: (): Promise<ActionResult<{ userId: number; email: string }>> =>
    ipcRenderer.invoke(IPC.COIN2U_VERIFY),
};

contextBridge.exposeInMainWorld('beefor', api);

export type BeeforApi = typeof api;

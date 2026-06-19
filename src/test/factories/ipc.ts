import { vi } from 'vitest';
import type { IpcClients } from '../../renderer/services/ipc';

const okVoid = () => ({ ok: true as const, data: undefined });
const okData = <T>(data: T) => ({ ok: true as const, data });

export function createFakeIpcClients(overrides: Partial<IpcClients> = {}): IpcClients {
  const clients: IpcClients = {
    session: {
      getStatus: vi.fn(async () => 'idle' as const),
      login: vi.fn(async () => okVoid()),
      logout: vi.fn(async () => okVoid()),
      verify: vi.fn(async () => okData('idle' as const)),
      onStatus: vi.fn(() => vi.fn()),
      saveCredentials: vi.fn(async () => okVoid()),
      getCredentials: vi.fn(async () => null),
      clearCredentials: vi.fn(async () => okVoid()),
    },
    settings: {
      get: vi.fn(async () => defaultSettings()),
      set: vi.fn(async () => okVoid()),
    },
    timesheet: {
      autoLancamento: vi.fn(async () => okVoid()),
      lancarHora: vi.fn(async () => okVoid()),
      fetch: vi.fn(async () => okData([])),
      openBeefor: vi.fn(async () => okVoid()),
    },
    mood: {
      select: vi.fn(async () => okVoid()),
      getCurrent: vi.fn(async () => okData<string | null>(null)),
    },
    kudo: {
      send: vi.fn(async () => okData({ success: true, message: 'ok' })),
      searchRecipient: vi.fn(async () => okData([])),
      getCounts: vi.fn(async () => okData({ enviados: 0, recebidos: 0 })),
      getLists: vi.fn(async () => okData({ enviados: [], recebidos: [] })),
      getDetail: vi.fn(async () => ({
        ok: true as const,
        data: {
          id: null,
          mensagemBoxKudoCard: '',
          mensagemKudoCard: '',
          nomeOrganizacao: '',
          tipoKudoCard: 1,
          dataEnvio: '',
        },
      })),
    },
    team: {
      fetchMembers: vi.fn(async () => okData([])),
    },
    coin2u: {
      saveCreds: vi.fn(async () => okVoid()),
      getCreds: vi.fn(async () => null),
      clearCreds: vi.fn(async () => okVoid()),
      getDashboard: vi.fn(async () => ({
        ok: true as const,
        data: { Coins: 0, CurrentQuotation: 0, DaysToExpire: 0, ExchangeCoins: 0 },
      })),
      getLog: vi.fn(async () => okData({ Log: [] })),
      getShop: vi.fn(async () => okData({ Coins: 0, ShopItems: [] })),
      buyItem: vi.fn(async () => okData(true)),
      transfer: vi.fn(async () => okData(true)),
      verify: vi.fn(async () => okData({ userId: 1, email: 'test@example.com' })),
    },
    atividades: {
      fetch: vi.fn(async () => okData([])),
    },
    system: {
      getAdminStatus: vi.fn(async () => ({ elevated: false, platform: 'test' })),
      relaunchAsAdmin: vi.fn(async () => okVoid()),
      relaunchApp: vi.fn(async () => okVoid()),
      testNotification: vi.fn(async () => okVoid()),
      getTodayAlerts: vi.fn(async () => okData([])),
      onPlayAlarm: vi.fn(() => vi.fn()),
      onNotify: vi.fn(() => vi.fn()),
      onUpdateAvailable: vi.fn(() => vi.fn()),
      onUpdateDownloaded: vi.fn(() => vi.fn()),
      onTrayLunchTimer: vi.fn(() => vi.fn()),
      onTrayOpenKudo: vi.fn(() => vi.fn()),
      onTrayOpenCoins: vi.fn(() => vi.fn()),
      setLunchTimerActive: vi.fn(),
      quitAndInstallUpdate: vi.fn(async () => undefined),
      getAssetPath: vi.fn(async () => ''),
      readAsset: vi.fn(async () => null),
      notifyWindows: vi.fn(async () => okVoid()),
      pokerGetPort: vi.fn(async () => 4242),
      pokerGetLocalIp: vi.fn(async () => '127.0.0.1'),
      pokerStartTunnel: vi.fn(async () => okData('https://test.trycloudflare.com')),
      pokerStopTunnel: vi.fn(async () => okVoid()),
      clipboardWrite: vi.fn(async () => okVoid()),
      consumeDeepLink: vi.fn(async () => null),
      onDeepLink: vi.fn(() => vi.fn()),
    },
    window: {
      minimize: vi.fn(),
      maximize: vi.fn(),
      close: vi.fn(),
      setIcon: vi.fn(),
    },
  };

  return {
    ...clients,
    ...overrides,
  };
}

export function defaultSettings() {
  return {
    autoStart: false,
    autoLoginOnLaunch: true,
    automatePunch: false,
    punchTimes: ['08:00', '12:00', '13:00', '17:00'] as [string, string, string, string],
    punchDriftMinutes: 0,
    lunchAlarm: false,
    lunchAlarmTime: '12:00',
    moodNotification: false,
    moodNotificationTime: '09:00',
    moodAlarm: false,
    kudocardNotification: false,
    kudocardFrequency: 'once' as const,
    kudocardDays: [],
    pjAlarm: false,
    pjAlarmDay: 1,
    pjAlarmTime: '09:00',
    hoursPerDay: 8,
    hourRate: 0,
    patchJournal: '',
  };
}

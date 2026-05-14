import type { Coin2uOrg } from './coin2u';

export type KudocardFrequency = 'once' | 'twice' | 'custom';

export type TrayMenuItemType =
  | 'open'
  | 'autoLancamento'
  | 'mood'
  | 'openBeefor'
  | 'logout'
  | 'separator'
  | 'quit'
  | 'lunchTimer'
  | 'sendKudo'
  | 'sendCoins';

export interface TrayMenuItem {
  id: string;
  type: TrayMenuItemType;
}

export const DEFAULT_TRAY_MENU: TrayMenuItem[] = [
  { id: '1', type: 'open' },
  { id: '2', type: 'separator' },
  { id: '3', type: 'autoLancamento' },
  { id: '4', type: 'mood' },
  { id: '5', type: 'separator' },
  { id: '6', type: 'quit' },
];

export interface ThemeOverrides {
  accent: string;
  accentHover: string;
  warm: string;
  ok: string;
  err: string;
  radius: string;
  fontScale: string; // e.g. "0.9" | "1" | "1.1"
}

export interface AppSettings {
  autoStart: boolean;
  autoLoginOnLaunch: boolean;

  /** Auto punch base times "HH:MM" (4 entries: entrada, saída almoço, retorno, saída) */
  automatePunch: boolean;
  punchTimes: [string, string, string, string];
  /** Max minutes drift applied randomly per day to each base time */
  punchDriftMinutes: number;

  lunchAlarm: boolean;
  lunchAlarmTime: string; // "HH:MM"

  moodNotification: boolean;
  moodNotificationTime: string; // "HH:MM"
  moodAlarm: boolean;

  kudocardNotification: boolean;
  kudocardFrequency: KudocardFrequency;
  /** Used when frequency === 'custom'. Day numbers 1..31 */
  kudocardDays: number[];
  /** Optional fixed time "HH:MM" for kudocard alerts. When unset, scheduler picks random time. */
  kudocardNotificationTime?: string;
  /**
   * Persisted schedule for the current month so restarts don't re-roll.
   * Key format: "YYYY-M". Value: array of {day, time} sorted by day.
   */
  kudocardSchedule?: { ym: string; slots: Array<{ day: number; time: string }> };

  hoursPerDay: number;
  hourRate: number;
  /** Show "Valor extras" summary card. Only relevant when hourRate > 0 */
  showOvertimeValue?: boolean;
  /** Show "Total estimado" summary card. Only relevant when hourRate > 0 */
  showTotalSalary?: boolean;
  patchJournal: string;

  /** User dismissed the "run as admin" banner — don't show again */
  adminBannerDismissed?: boolean;

  /** Home layout: 'classic' (table) | 'minimal' (calendar + day panel) */
  viewMode?: 'classic' | 'minimal';

  /** Calendar cells show daily diff (+23m / -10m) instead of status dot */
  calendarShowDiff?: boolean;

  /** Logo variant: 'orange' (default) | 'purple' */
  logoVariant?: 'orange' | 'purple';

  /** UI density */
  uiDensity?: 'compact' | 'normal' | 'comfortable';

  /** Custom theme overrides (CSS variable values) */
  themeOverrides?: Partial<ThemeOverrides>;

  /** Active theme preset id (resolves dark/light tokens at apply time) */
  themePresetId?: string;

  /** UI click/hover sound effects */
  uiSounds?: boolean;

  /** Custom tray menu items in order */
  trayMenu?: TrayMenuItem[];

  /** Coin2U userId (numeric) for dashboard fetch — auto-captured on login */
  coin2uUserId?: number;

  /** Full Info object captured at last successful Coin2U login */
  coin2uInfo?: Record<string, unknown>;

  /** Org list returned by /User/GetOrgList — cached for offline UI */
  coin2uOrgs?: Coin2uOrg[];
}

export interface TodayAlert {
  kind: 'kudocard' | 'mood' | 'lunch' | 'punch' | 'birthday';
  title: string;
  body: string;
  time?: string; // "HH:MM" when scheduled
  snoozedUntil?: string; // "HH:MM" — set client-side to suppress until that time
}

export type SessionStatus =
  | 'idle'
  | 'loading'
  | 'reconnecting'
  | 'connected'
  | 'disconnected'
  | 'expired'
  | 'error';

export type Mood = 'Dia feliz' | 'Dia bom' | 'Dia não tão bom' | 'Dia triste';

export const MOODS: Mood[] = [
  'Dia feliz',
  'Dia bom',
  'Dia não tão bom',
  'Dia triste',
];

export interface Credentials {
  email: string;
  password: string;
}

export type KudocardFrequency = 'once' | 'twice' | 'custom';

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
  /** Used when frequency === 'custom'. Day numbers 1..28 */
  kudocardDays: number[];
  /**
   * Persisted schedule for the current month so restarts don't re-roll.
   * Key format: "YYYY-M". Value: array of {day, time} sorted by day.
   */
  kudocardSchedule?: { ym: string; slots: Array<{ day: number; time: string }> };

  hoursPerDay: number;
  hourRate: number;
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
}

export interface ThemeOverrides {
  accent: string;
  accentHover: string;
  warm: string;
  ok: string;
  err: string;
  radius: string;
  fontScale: string; // e.g. "0.9" | "1" | "1.1"
}

export interface TodayAlert {
  kind: 'kudocard' | 'mood' | 'lunch' | 'punch';
  title: string;
  body: string;
  time?: string; // "HH:MM" when scheduled
  snoozedUntil?: string; // "HH:MM" — set client-side to suppress until that time
}

export interface ActionResult<T = void> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface LogEntry {
  ts: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

/** Time as "HH:MM" (24h). Empty string = vazio. */
export type TimeStr = string;

export interface TimesheetEntry {
  date: string;          // ISO yyyy-mm-dd
  entrada: TimeStr;
  int1: TimeStr;
  ret1: TimeStr;
  int2: TimeStr;
  ret2: TimeStr;
  saida: TimeStr;
  comentario?: string;
}

export interface FetchedTimesheetRow extends TimesheetEntry {
  total: string;       // "HH:MM" as reported by Beefor
  status: string;      // "Feriado", etc
  editable: boolean;
}

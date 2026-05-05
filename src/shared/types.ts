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

  hoursPerDay: number;
  hourRate: number;
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

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

export interface AppSettings {
  autoStart: boolean;
  autoLoginOnLaunch: boolean;
  automatePunch: boolean;
  lunchAlarm: boolean;
  moodNotification: boolean;
  kudocardNotification: boolean;
  adjustInitialLayout: boolean;
  /** Hours per workday (e.g. 8). Used to compute diff vs total. */
  hoursPerDay: number;
  /** Hourly rate in BRL. Used for salary estimate. */
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

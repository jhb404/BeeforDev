export type ActionResult<T = void> =
  | { ok: true; data: T extends void ? undefined : T }
  | { ok: false; error: string };

export interface LogEntry {
  ts: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

/** Time as "HH:MM" (24h). Empty string = vazio. */
export type TimeStr = string;

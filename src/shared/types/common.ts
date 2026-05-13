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

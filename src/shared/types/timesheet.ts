import type { TimeStr } from './common';

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

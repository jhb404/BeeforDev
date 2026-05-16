import type {
  FetchedTimesheetRow,
  TimesheetEntry,
} from '@shared/types/index';
import { daysInMonth, isoDate, weekdayOf } from '../../../utils/dates';

export interface RowState extends TimesheetEntry {
  weekday: number;
  status?: string;
  editable: boolean;
  saving?: boolean;
  saved?: boolean;
  failed?: boolean;
  errMsg?: string;
}

export const FIELDS: Array<{
  key: keyof Omit<TimesheetEntry, 'date' | 'comentario'>;
  label: string;
}> = [
  { key: 'entrada', label: 'Entrada' },
  { key: 'int1', label: 'Int. 1' },
  { key: 'ret1', label: 'Ret. 1' },
  { key: 'int2', label: 'Int. 2' },
  { key: 'ret2', label: 'Ret. 2' },
  { key: 'saida', label: 'Saída' },
];

export function emptyRow(year: number, month: number, day: number): RowState {
  const wd = weekdayOf(year, month, day);
  return {
    date: isoDate(year, month, day),
    weekday: wd,
    entrada: '',
    int1: '',
    ret1: '',
    int2: '',
    ret2: '',
    saida: '',
    comentario: '',
    editable: true,
  };
}

export function buildEmpty(year: number, month: number): RowState[] {
  const total = daysInMonth(year, month);
  const out: RowState[] = [];
  for (let d = 1; d <= total; d++) out.push(emptyRow(year, month, d));
  return out;
}

export function mergeFetched(
  year: number,
  month: number,
  fetched: FetchedTimesheetRow[],
): RowState[] {
  const base = buildEmpty(year, month);
  const byDate = new Map(fetched.map((f) => [f.date, f]));
  return base.map((r) => {
    const f = byDate.get(r.date);
    if (!f) return r;
    return {
      ...r,
      entrada: f.entrada,
      int1: f.int1,
      ret1: f.ret1,
      int2: f.int2,
      ret2: f.ret2,
      saida: f.saida,
      comentario: f.comentario ?? '',
      status: f.status,
      editable: true,
    };
  });
}

export function rowStatusKind(r: RowState): 'full' | 'partial' | 'empty' | 'holiday' {
  if ((r.status ?? '').toLowerCase().includes('feriado')) return 'holiday';
  const filled = [r.entrada, r.int1, r.ret1, r.int2, r.ret2, r.saida].filter(Boolean).length;
  if (filled >= 4) return 'full';
  if (filled > 0) return 'partial';
  return 'empty';
}

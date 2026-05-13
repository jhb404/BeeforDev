export const TIME_KEYS = ['entrada', 'int1', 'ret1', 'int2', 'ret2', 'saida'] as const;
export type TimeKey = (typeof TIME_KEYS)[number];
export type PersistedRowValues = Record<TimeKey | 'comentario', string>;

export interface SavePayloads {
  main: unknown | null;
  comment: unknown | null;
}

export interface FetchedRow {
  date: string;
  entrada: string;
  int1: string;
  ret1: string;
  int2: string;
  ret2: string;
  saida: string;
  total: string;
  comentario: string;
  status: string;
  editable: boolean;
}

export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function normalizeTimeForCompare(value: string | null | undefined): string {
  return (value ?? '').trim();
}

export function formatDateLabel(date: string): string {
  const [yyyy, mm, dd] = date.split('-');
  return yyyy && mm && dd ? `${dd}/${mm}/${yyyy}` : date;
}

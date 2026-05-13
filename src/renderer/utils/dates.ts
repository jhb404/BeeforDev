export const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const WEEKDAY_SHORT_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function isoDate(year: number, month1: number, day: number): string {
  return `${year}-${pad2(month1)}-${pad2(day)}`;
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(year, month1, 0).getDate();
}

export function weekdayOf(year: number, month1: number, day: number): number {
  return new Date(year, month1 - 1, day).getDay();
}

export function todayIso(): string {
  const d = new Date();
  return isoDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function formatDateTimePtBr(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Accepts "YYYY-MM-DD" or "MM-DD". Returns "12 de março" or "—". */
export function formatBirthdayPretty(value: string | undefined | null): string {
  if (!value) return '—';
  const m = /^(\d{4}-)?(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return value;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return value;
  return `${day} de ${MONTHS_PT[month - 1].toLowerCase()}`;
}

export function isBirthdayToday(value: string | undefined | null): boolean {
  if (!value) return false;
  const m = /^(\d{4}-)?(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return false;
  const today = new Date();
  return today.getMonth() + 1 === Number(m[2]) && today.getDate() === Number(m[3]);
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

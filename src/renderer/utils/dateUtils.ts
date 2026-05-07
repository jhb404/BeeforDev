const MONTHS_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

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
  return `${day} de ${MONTHS_PT[month - 1]}`;
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

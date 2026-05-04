/** Parse "HH:MM" into minutes. Returns 0 if invalid/empty. */
export function toMinutes(hhmm: string): number {
  if (!hhmm) return 0;
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Format signed minutes as "+HH:MM" / "-HH:MM" / "HH:MM". */
export function formatMinutes(mins: number, signed = false): string {
  const sign = mins < 0 ? '-' : signed ? '+' : '';
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Compute worked minutes from punch fields. */
export function workedMinutes(args: {
  entrada: string;
  int1: string;
  ret1: string;
  int2: string;
  ret2: string;
  saida: string;
}): number {
  const e = toMinutes(args.entrada);
  const i1 = toMinutes(args.int1);
  const r1 = toMinutes(args.ret1);
  const i2 = toMinutes(args.int2);
  const r2 = toMinutes(args.ret2);
  const s = toMinutes(args.saida);

  if (!e || !s) return 0;

  let total = s - e;
  if (i1 && r1) total -= r1 - i1;
  if (i2 && r2) total -= r2 - i2;
  return Math.max(0, total);
}

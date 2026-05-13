import { todayKey } from './time';

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Deterministic per-day drift so the same minute fires once per day. */
export function applyDailyDrift(base: string, maxMin: number, slot: number): string {
  if (!maxMin) return base;
  const m = /^(\d{1,2}):(\d{2})$/.exec(base);
  if (!m) return base;
  const h = Number(m[1]);
  const min = Number(m[2]);

  const today = todayKey();
  const seed = hashString(`${today}-${slot}`);
  const drift = (seed % (2 * maxMin + 1)) - maxMin;
  const totalMinutes = h * 60 + min + drift;
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const oh = Math.floor(clamped / 60);
  const om = clamped % 60;
  return `${String(oh).padStart(2, '0')}:${String(om).padStart(2, '0')}`;
}

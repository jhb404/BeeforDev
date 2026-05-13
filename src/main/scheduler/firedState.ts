import { todayKey } from './time';

interface FiredKey {
  key: string;
  date: string;
}

let firedToday: FiredKey[] = [];

export function alreadyFired(key: string): boolean {
  const today = todayKey();
  firedToday = firedToday.filter((f) => f.date === today);
  return firedToday.some((f) => f.key === key && f.date === today);
}

export function markFired(key: string): void {
  firedToday.push({ key, date: todayKey() });
}

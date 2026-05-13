import { logger } from '../logger';
import { saveSettings } from '../sessionStore';
import type { AppSettings } from '../../shared/types';
import { isWeekday } from './time';

function randomWeekdaysInMonth(count: number, year: number, month: number): number[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const weekdays: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    if (isWeekday(year, month, d)) weekdays.push(d);
  }
  // Fisher-Yates shuffle then take first `count`
  for (let i = weekdays.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [weekdays[i], weekdays[j]] = [weekdays[j], weekdays[i]];
  }
  return weekdays.slice(0, count).sort((a, b) => a - b);
}

function randomTimeInWorkday(): string {
  // random minute between 09:00 and 17:59
  const totalMinutes = 9 * 60 + Math.floor(Math.random() * (9 * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function ensureKudocardSchedule(
  s: AppSettings,
): Promise<Array<{ day: number; time: string }>> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const fixedTime = s.kudocardNotificationTime?.match(/^\d{2}:\d{2}$/)
    ? s.kudocardNotificationTime
    : null;
  const ym = `${year}-${month}${fixedTime ? `@${fixedTime}` : ''}`;

  if (s.kudocardSchedule?.ym === ym) {
    return s.kudocardSchedule.slots;
  }

  let days: number[];
  if (s.kudocardFrequency === 'custom') {
    const daysInMonth = new Date(year, month, 0).getDate();
    days = s.kudocardDays
      .filter((d) => d >= 1 && d <= daysInMonth)
      .filter((d) => isWeekday(year, month, d));
  } else {
    const count = s.kudocardFrequency === 'once' ? 1 : 2;
    days = randomWeekdaysInMonth(count, year, month);
  }

  const slots = days.map((day) => ({ day, time: fixedTime ?? randomTimeInWorkday() }));
  logger.info(
    `Kudocard schedule for ${ym}: ${slots.map((s) => `day ${s.day} @ ${s.time}`).join(', ')}`,
  );

  await saveSettings({ ...s, kudocardSchedule: { ym, slots } });
  return slots;
}

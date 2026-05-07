import { BrowserWindow, Notification } from 'electron';
import { logger } from './logger';
import { loadSettings, saveSettings } from './sessionStore';
import { IPC } from '../shared/ipc';
import type { AppSettings, TodayAlert } from '../shared/types';
import { getBuildAssetPath } from './window';

function appIconPath(): string {
  return getBuildAssetPath('icon.png');
}

const TICK_MS = 30_000; // 30s — fine grained enough for HH:MM matching

interface FiredKey {
  key: string;
  date: string;
}

let timer: NodeJS.Timeout | null = null;
let firedToday: FiredKey[] = [];

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function isWeekend(): boolean {
  const dow = new Date().getDay();
  return dow === 0 || dow === 6;
}

function alreadyFired(key: string): boolean {
  const today = todayKey();
  // garbage collect older days
  firedToday = firedToday.filter((f) => f.date === today);
  return firedToday.some((f) => f.key === key && f.date === today);
}

function markFired(key: string): void {
  firedToday.push({ key, date: todayKey() });
}

function notify(
  win: BrowserWindow | null,
  title: string,
  body: string,
  withAlarm: boolean,
): void {
  try {
    if (Notification.isSupported()) {
      const n = new Notification({
        title,
        body,
        icon: appIconPath(),
        urgency: 'critical',
        timeoutType: 'never',
      });
      n.show();
    } else {
      logger.warn('Notifications not supported on this system');
    }
  } catch (err) {
    logger.error('Notification failed', err);
  }
  if (withAlarm && win && !win.isDestroyed()) {
    win.webContents.send(IPC.EVT_PLAY_ALARM, { title, body });
  }
  if (win && !win.isDestroyed()) {
    win.webContents.send(IPC.EVT_NOTIFY, { title, body });
  }
}

function isWeekday(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month - 1, day).getDay();
  return dow !== 0 && dow !== 6;
}

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

async function ensureKudocardSchedule(
  s: AppSettings,
): Promise<Array<{ day: number; time: string }>> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const fixedTime = s.kudocardNotificationTime?.match(/^\d{2}:\d{2}$/) ? s.kudocardNotificationTime : null;
  // Embed fixed-time choice in cache key so toggling it forces a re-roll only of times.
  const ym = `${year}-${month}${fixedTime ? `@${fixedTime}` : ''}`;

  // Return persisted schedule if still valid for this month + time mode
  if (s.kudocardSchedule?.ym === ym) {
    return s.kudocardSchedule.slots;
  }

  // Build new schedule for this month
  let days: number[];
  if (s.kudocardFrequency === 'custom') {
    // Filter user-chosen days (1..31) to only weekdays present in this month
    const daysInMonth = new Date(year, month, 0).getDate();
    days = s.kudocardDays
      .filter((d) => d >= 1 && d <= daysInMonth)
      .filter((d) => isWeekday(year, month, d));
  } else {
    const count = s.kudocardFrequency === 'once' ? 1 : 2;
    days = randomWeekdaysInMonth(count, year, month);
  }

  const slots = days.map((day) => ({ day, time: fixedTime ?? randomTimeInWorkday() }));
  logger.info(`Kudocard schedule for ${ym}: ${slots.map((s) => `day ${s.day} @ ${s.time}`).join(', ')}`);

  // Persist so restarts don't re-roll
  await saveSettings({ ...s, kudocardSchedule: { ym, slots } });
  return slots;
}

async function tick(getWin: () => BrowserWindow | null): Promise<void> {
  const win = getWin();
  if (!win) return;
  let s: AppSettings;
  try {
    s = await loadSettings();
  } catch (err) {
    logger.error('scheduler: loadSettings failed', err);
    return;
  }

  const hhmm = nowHHMM();
  const weekend = isWeekend();
  const todayDay = new Date().getDate();

  // Mood
  if (
    (s.moodNotification || s.moodAlarm) &&
    s.moodNotificationTime === hhmm &&
    !alreadyFired('mood')
  ) {
    if (!weekend) {
      notify(
        win,
        '😊 Mood do dia',
        'Não esquece de marcar seu mood no Beefor!',
        s.moodAlarm,
      );
      markFired('mood');
    }
  }

  // Lunch
  if (s.lunchAlarm && s.lunchAlarmTime === hhmm && !alreadyFired('lunch')) {
    if (!weekend) {
      notify(win, '🍽️ Hora do almoço', 'Bom apetite! Lembra de bater o ponto.', true);
      markFired('lunch');
    }
  }

  // Kudocard — fires on persisted weekday slots between 09:00–17:59
  if (s.kudocardNotification && !weekend) {
    const slots = await ensureKudocardSchedule(s);
    const todaySlot = slots.find((slot) => slot.day === todayDay && slot.time === hhmm);
    if (todaySlot && !alreadyFired('kudocard')) {
      notify(
        win,
        '🏆 Kudocard',
        'Hoje é dia de reconhecer alguém — manda um kudocard!',
        false,
      );
      markFired('kudocard');
    }
  }

  // Punch — only notif (real punch click left for future implementation)
  if (s.automatePunch && !weekend) {
    s.punchTimes.forEach((base, idx) => {
      if (!base) return;
      const driftedKey = `punch-${idx}`;
      const target = applyDailyDrift(base, s.punchDriftMinutes, idx);
      if (target === hhmm && !alreadyFired(driftedKey)) {
        const labels = ['Entrada', 'Saída p/ almoço', 'Retorno do almoço', 'Saída'];
        const icons = ['🟢', '🟡', '🔵', '🔴'];
        notify(
          win,
          `${icons[idx]} Ponto — ${labels[idx]}`,
          `Hora de bater o ponto (${target})`,
          true,
        );
        markFired(driftedKey);
      }
    });
  }
}

/** Deterministic per-day drift so the same minute fires once per day. */
function applyDailyDrift(base: string, maxMin: number, slot: number): string {
  if (!maxMin) return base;
  const m = /^(\d{1,2}):(\d{2})$/.exec(base);
  if (!m) return base;
  const h = Number(m[1]);
  const min = Number(m[2]);

  const today = todayKey();
  const seed = hashString(`${today}-${slot}`);
  // map seed to [-maxMin, +maxMin]
  const drift = (seed % (2 * maxMin + 1)) - maxMin;
  const totalMinutes = h * 60 + min + drift;
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const oh = Math.floor(clamped / 60);
  const om = clamped % 60;
  return `${String(oh).padStart(2, '0')}:${String(om).padStart(2, '0')}`;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function startScheduler(getWin: () => BrowserWindow | null): void {
  stopScheduler();
  void tick(getWin);
  timer = setInterval(() => void tick(getWin), TICK_MS);
  logger.info('Scheduler started');
}

export function stopScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

/** Returns alerts scheduled for today based on current settings. */
export async function getTodayAlerts(): Promise<TodayAlert[]> {
  const s = await loadSettings();
  const now = new Date();
  const todayDay = now.getDate();
  const weekend = isWeekend();
  const alerts: TodayAlert[] = [];

  if (!weekend) {
    if (s.moodNotification || s.moodAlarm) {
      alerts.push({
        kind: 'mood',
        title: '😊 Mood do dia',
        body: 'Marcar mood no Beefor.',
        time: s.moodNotificationTime,
      });
    }

    if (s.lunchAlarm) {
      alerts.push({
        kind: 'lunch',
        title: '🍽️ Almoço',
        body: 'Lembrete de almoço.',
        time: s.lunchAlarmTime,
      });
    }

    if (s.automatePunch) {
      const labels = ['Entrada', 'Saída p/ almoço', 'Retorno', 'Saída'];
      const icons = ['🟢', '🟡', '🔵', '🔴'];
      s.punchTimes.forEach((base, idx) => {
        if (!base) return;
        const time = applyDailyDrift(base, s.punchDriftMinutes, idx);
        alerts.push({
          kind: 'punch',
          title: `${icons[idx]} Ponto — ${labels[idx]}`,
          body: `Bater ponto às ${time}.`,
          time,
        });
      });
    }

    if (s.kudocardNotification) {
      const slots = await ensureKudocardSchedule(s);
      const todaySlot = slots.find((slot) => slot.day === todayDay);
      if (todaySlot) {
        alerts.push({
          kind: 'kudocard',
          title: '🏆 Kudocard',
          body: 'Hoje é dia de mandar um kudocard!',
          time: todaySlot.time,
        });
      }
    }
  }

  return alerts.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
}

/** Test hook — fires notif immediately for given kind. */
export function fireTestNotification(
  win: BrowserWindow | null,
  kind: 'mood' | 'lunch' | 'kudocard' | 'punch',
): void {
  if (!win) return;
  const map = {
    mood: { title: '😊 Mood do dia', body: 'Não esquece de marcar seu mood no Beefor!', alarm: true },
    lunch: { title: '🍽️ Hora do almoço', body: 'Bom apetite! Lembra de bater o ponto.', alarm: true },
    kudocard: { title: '🏆 Kudocard', body: 'Hoje é dia de reconhecer alguém — manda um kudocard!', alarm: false },
    punch: { title: '🟢 Ponto — Entrada', body: 'Hora de bater o ponto.', alarm: true },
  };
  const cfg = map[kind];
  notify(win, cfg.title, cfg.body, cfg.alarm);
}

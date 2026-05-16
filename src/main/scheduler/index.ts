import { BrowserWindow } from 'electron';
import { logger } from '../logger';
import { loadSettings } from '../sessionStore';
import type { AppSettings } from '../../shared/types/index';
import { nowHHMM, isWeekend } from './time';
import { alreadyFired, markFired } from './firedState';
import { notify } from './notify';
import { applyDailyDrift } from './drift';
import { ensureKudocardSchedule } from './schedulePersist';

export { getTodayAlerts } from './alerts';

const TICK_MS = 30_000; // 30s — fine grained enough for HH:MM matching

let timer: NodeJS.Timeout | null = null;

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
      notify(win, '😊 Mood do dia', 'Não esquece de marcar seu mood no Beefor!', s.moodAlarm);
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
      notify(win, '🏆 Kudocard', 'Hoje é dia de reconhecer alguém — manda um kudocard!', true);
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

/** Test hook — fires notif immediately for given kind. */
export function fireTestNotification(
  win: BrowserWindow | null,
  kind: 'mood' | 'lunch' | 'kudocard' | 'punch',
): void {
  if (!win) return;
  const map = {
    mood: {
      title: '😊 Mood do dia',
      body: 'Não esquece de marcar seu mood no Beefor!',
      alarm: true,
    },
    lunch: {
      title: '🍽️ Hora do almoço',
      body: 'Bom apetite! Lembra de bater o ponto.',
      alarm: true,
    },
    kudocard: {
      title: '🏆 Kudocard',
      body: 'Hoje é dia de reconhecer alguém — manda um kudocard!',
      alarm: true,
    },
    punch: { title: '🟢 Ponto — Entrada', body: 'Hora de bater o ponto.', alarm: true },
  };
  const cfg = map[kind];
  notify(win, cfg.title, cfg.body, cfg.alarm);
}

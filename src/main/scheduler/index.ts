import { BrowserWindow } from 'electron';
import { logger } from '../logger';
import { loadSettings } from '../sessionStore';
import type { AppSettings } from '../../shared/types/index';
import { nowHHMM, isWeekend } from './time';
import { alreadyFired, markFired } from './firedState';
import { notify } from './notify';
import { ensureKudocardSchedule } from './schedulePersist';
import { usaTimesheetBeefor } from '../services/beeforHttpClient';
import { LANCAMENTO_ICONS, LANCAMENTO_LABELS } from './labels';

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
  // Pessoa sem TimeSheet Beefor não recebe lembrete de lançamento de horas/intervalo.
  const ts = usaTimesheetBeefor();

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
        'mood',
      );
      markFired('mood');
    }
  }

  // Intervalo
  if (ts && s.lunchAlarm && s.lunchAlarmTime === hhmm && !alreadyFired('lunch')) {
    if (!weekend) {
      notify(win, '🍽️ Hora do intervalo', 'Lembra de lançar o intervalo no Beefor.', true, 'lunch');
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
        true,
        'kudocard',
      );
      markFired('kudocard');
    }
  }

  // Mensal — lembrete de lançar as horas do mês, num dia fixo (clamp p/ último dia se mês curto)
  if (ts && s.pjAlarm && s.pjAlarmTime === hhmm && !alreadyFired('pj')) {
    const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const targetDay = Math.min(s.pjAlarmDay, lastDay);
    if (todayDay === targetDay) {
      notify(
        win,
        '🧾 Lançamento de horas',
        'Hoje é dia de lançar suas horas no Beefor!',
        true,
        'pj',
      );
      markFired('pj');
    }
  }

  // Alerta diário — só notificação; o lançamento em si é feito pela pessoa.
  if (ts && s.automatePunch && !weekend) {
    s.punchTimes.forEach((target, idx) => {
      if (!target) return;
      const key = `punch-${idx}`;
      if (target === hhmm && !alreadyFired(key)) {
        notify(
          win,
          `${LANCAMENTO_ICONS[idx]} Lançamento de horas — ${LANCAMENTO_LABELS[idx]}`,
          `Hora de lançar ${LANCAMENTO_LABELS[idx]} (${target}).`,
          true,
          'punch',
        );
        markFired(key);
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
  kind: 'mood' | 'lunch' | 'kudocard' | 'punch' | 'pj',
): void {
  if (!win) return;
  const map = {
    mood: {
      title: '😊 Mood do dia',
      body: 'Não esquece de marcar seu mood no Beefor!',
      alarm: true,
    },
    lunch: {
      title: '🍽️ Hora do intervalo',
      body: 'Lembra de lançar o intervalo no Beefor.',
      alarm: true,
    },
    kudocard: {
      title: '🏆 Kudocard',
      body: 'Hoje é dia de reconhecer alguém — manda um kudocard!',
      alarm: true,
    },
    punch: {
      title: `${LANCAMENTO_ICONS[0]} Lançamento de horas — ${LANCAMENTO_LABELS[0]}`,
      body: `Hora de lançar ${LANCAMENTO_LABELS[0]}.`,
      alarm: true,
    },
    pj: {
      title: '🧾 Lançamento de horas',
      body: 'Hoje é dia de lançar suas horas no Beefor!',
      alarm: true,
    },
  };
  const cfg = map[kind];
  notify(win, cfg.title, cfg.body, cfg.alarm, kind);
}

import { BrowserWindow, Notification } from 'electron';
import { logger } from './logger';
import { loadSettings } from './sessionStore';
import { IPC } from '../shared/ipc';
import type { AppSettings } from '../shared/types';

const TICK_MS = 30_000; // 30s — fine grained enough for HH:MM matching

interface FiredKey {
  key: string;
  date: string;
}

let timer: NodeJS.Timeout | null = null;
let firedToday: FiredKey[] = [];
let kudocardDaysForMonth: { ym: string; days: Set<number> } = {
  ym: '',
  days: new Set(),
};

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
        urgency: 'critical',
      });
      n.show();
    } else {
      logger.warn('Notifications not supported on this system');
    }
  } catch (err) {
    logger.error('Notification failed', err);
  }
  // ask renderer to play alarm sound (no admin needed)
  if (withAlarm && win && !win.isDestroyed()) {
    win.webContents.send(IPC.EVT_PLAY_ALARM, { title, body });
  }
  if (win && !win.isDestroyed()) {
    win.webContents.send(IPC.EVT_NOTIFY, { title, body });
  }
}

function pickRandomKudocardDays(count: number, max = 28): number[] {
  const out = new Set<number>();
  while (out.size < count) {
    out.add(1 + Math.floor(Math.random() * max));
  }
  return [...out].sort((a, b) => a - b);
}

function ensureKudocardDays(s: AppSettings): number[] {
  const d = new Date();
  const ym = `${d.getFullYear()}-${d.getMonth() + 1}`;
  if (kudocardDaysForMonth.ym !== ym) {
    let days: number[] = [];
    if (s.kudocardFrequency === 'custom') {
      days = [...s.kudocardDays];
    } else if (s.kudocardFrequency === 'once') {
      days = pickRandomKudocardDays(1);
    } else {
      days = pickRandomKudocardDays(2);
    }
    kudocardDaysForMonth = { ym, days: new Set(days) };
    logger.info(`Kudocard days for ${ym}: ${days.join(', ')}`);
  }
  return [...kudocardDaysForMonth.days].sort((a, b) => a - b);
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
        'Hora do mood',
        'Marque seu mood do dia no Beefor.',
        s.moodAlarm,
      );
      markFired('mood');
    }
  }

  // Lunch
  if (s.lunchAlarm && s.lunchAlarmTime === hhmm && !alreadyFired('lunch')) {
    if (!weekend) {
      notify(win, 'Almoço', 'Hora do almoço — bom apetite!', true);
      markFired('lunch');
    }
  }

  // Kudocard — fire once at 14:00 if today is in the chosen days
  if (s.kudocardNotification && hhmm === '14:00') {
    const days = ensureKudocardDays(s);
    if (days.includes(todayDay) && !alreadyFired('kudocard') && !weekend) {
      notify(
        win,
        'Kudocard',
        'Hoje é dia de mandar um kudocard pra alguém!',
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
        const labels = ['Entrada', 'Saída almoço', 'Retorno', 'Saída'];
        notify(
          win,
          `Ponto: ${labels[idx]}`,
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

/** Test hook — fires notif immediately for given kind. */
export function fireTestNotification(
  win: BrowserWindow | null,
  kind: 'mood' | 'lunch' | 'kudocard' | 'punch',
): void {
  if (!win) return;
  const map = {
    mood: { title: 'Teste · Mood', body: 'Notificação de mood funcionando.', alarm: true },
    lunch: { title: 'Teste · Almoço', body: 'Alarme de almoço funcionando.', alarm: true },
    kudocard: { title: 'Teste · Kudocard', body: 'Notificação kudocard funcionando.', alarm: false },
    punch: { title: 'Teste · Ponto', body: 'Lembrete de batida de ponto.', alarm: true },
  };
  const cfg = map[kind];
  notify(win, cfg.title, cfg.body, cfg.alarm);
}

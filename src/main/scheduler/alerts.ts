import { loadSettings } from '../sessionStore';
import type { TodayAlert } from '../../shared/types/index';
import { isWeekend } from './time';
import { ensureKudocardSchedule } from './schedulePersist';
import { usaTimesheetBeefor } from '../services/beeforHttpClient';
import { LANCAMENTO_ICONS, LANCAMENTO_LABELS } from './labels';

/** Returns alerts scheduled for today based on current settings. */
export async function getTodayAlerts(): Promise<TodayAlert[]> {
  const s = await loadSettings();
  const now = new Date();
  const todayDay = now.getDate();
  const weekend = isWeekend();
  // Sem acesso ao TimeSheet: nada de lançamento de horas/intervalo. Mood e Kudocard continuam.
  const ts = usaTimesheetBeefor();
  const alerts: TodayAlert[] = [];

  if (!weekend) {
    if (s.moodNotification) {
      alerts.push({
        kind: 'mood',
        title: '😊 Mood do dia',
        body: 'Marcar mood no Beefor.',
        time: s.moodNotificationTime,
      });
    }

    if (s.lunchAlarm && ts) {
      alerts.push({
        kind: 'lunch',
        title: '🍽️ Intervalo',
        body: 'Lembrete de intervalo.',
        time: s.lunchAlarmTime,
      });
    }

    if (s.automatePunch && ts) {
      s.punchTimes.forEach((time, idx) => {
        if (!time) return;
        alerts.push({
          kind: 'punch',
          title: `${LANCAMENTO_ICONS[idx]} Lançamento de horas — ${LANCAMENTO_LABELS[idx]}`,
          body: `Lançar ${LANCAMENTO_LABELS[idx]} às ${time}.`,
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

  // Mensal — independente de fim de semana, só no dia configurado (clamp p/ último dia do mês)
  if (s.pjAlarm && ts) {
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (todayDay === Math.min(s.pjAlarmDay, lastDay)) {
      alerts.push({
        kind: 'pj',
        title: '🧾 Lançamento de horas',
        body: 'Hoje é dia de lançar suas horas no Beefor!',
        time: s.pjAlarmTime,
      });
    }
  }

  return alerts.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
}

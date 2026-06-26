import { loadSettings } from '../sessionStore';
import type { TodayAlert } from '../../shared/types/index';
import { isWeekend } from './time';
import { applyDailyDrift } from './drift';
import { ensureKudocardSchedule } from './schedulePersist';

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

  // PJ — independente de fim de semana, só no dia configurado (clamp p/ último dia do mês)
  if (s.pjAlarm) {
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (todayDay === Math.min(s.pjAlarmDay, lastDay)) {
      alerts.push({
        kind: 'pj',
        title: '🧾 Ajustar Pontos (PJ)',
        body: 'Hoje é dia de ajustar os pontos no Beefor!',
        time: s.pjAlarmTime,
      });
    }
  }

  return alerts.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
}

import { useEffect, useState } from 'react';
import type { TodayAlert } from '../../../shared/types';

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + mins;
  const clamped = Math.min(total, 23 * 60 + 59);
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
}

interface AlertsApi {
  alerts: TodayAlert[];
  visibleAlerts: TodayAlert[];
  currentMoodExternal: string | null;
  setCurrentMoodExternal: (mood: string | null) => void;
  dismiss: (index: number) => void;
  snooze: (index: number, minutes: number) => void;
}

export function useAlerts(): AlertsApi {
  const [alerts, setAlerts] = useState<TodayAlert[]>([]);
  const [currentMoodExternal, setCurrentMoodExternal] = useState<string | null>(null);

  useEffect(() => {
    void window.beefor.getTodayAlerts().then((res) => {
      if (res.ok && res.data) setAlerts(res.data);
    });
    void window.beefor.getCurrentMood().then((res) => {
      if (res.ok) setCurrentMoodExternal(res.data ?? null);
    });
  }, []);

  useEffect(() => {
    const off = window.beefor.onNotify((info) => {
      if (info.title === 'sync:autoLancamento' && info.body === 'ok') return;
    });
    return off;
  }, []);

  const dismiss = (i: number) =>
    setAlerts((prev) => prev.filter((_, j) => j !== i));

  const snooze = (i: number, mins: number) => {
    const until = addMinutes(nowHHMM(), mins);
    setAlerts((prev) =>
      prev.map((a, j) => (j === i ? { ...a, snoozedUntil: until } : a)),
    );
  };

  const now = nowHHMM();
  const visibleAlerts = alerts.filter((a) => {
    if (a.kind === 'mood' && currentMoodExternal) return false;
    if (a.snoozedUntil && a.snoozedUntil > now) return false;
    return true;
  });

  return {
    alerts,
    visibleAlerts,
    currentMoodExternal,
    setCurrentMoodExternal,
    dismiss,
    snooze,
  };
}

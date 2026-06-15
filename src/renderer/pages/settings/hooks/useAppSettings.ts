import { useEffect, useState } from 'react';
import type { AppSettings } from '@shared/types/index';
import { useIpc } from '../../../services/ipc';
import { APP_EVENTS, emitAppEvent } from '../../../app/events';
import { mergeSettings, SETTINGS_DEFAULTS } from '../defaults';

/** Carrega settings, expõe `update` que persiste e emite o evento global. */
export function useAppSettings() {
  const { settings: settingsClient } = useIpc();
  const [settings, setSettings] = useState<AppSettings>(SETTINGS_DEFAULTS);

  useEffect(() => {
    void settingsClient.get().then((s) => setSettings(mergeSettings(s)));
  }, [settingsClient]);

  const update = async <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => {
    const next = { ...settings, [k]: v };
    setSettings(next);
    await settingsClient.set(next);
    emitAppEvent(APP_EVENTS.SETTINGS_CHANGED);
  };

  const updatePunchTime = async (idx: 0 | 1 | 2 | 3, value: string) => {
    const next = [...settings.punchTimes] as AppSettings['punchTimes'];
    next[idx] = value;
    await update('punchTimes', next);
  };

  const toggleKudocardDay = async (day: number) => {
    const has = settings.kudocardDays.includes(day);
    const next = has
      ? settings.kudocardDays.filter((d) => d !== day)
      : [...settings.kudocardDays, day].sort((a, b) => a - b);
    await update('kudocardDays', next);
  };

  return { settings, update, updatePunchTime, toggleKudocardDay };
}

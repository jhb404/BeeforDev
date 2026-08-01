import type { AppSettings } from '@shared/types/index';

const DEFAULT_PUNCH: AppSettings['punchTimes'] = ['09:00', '12:00', '13:00', '18:00'];

export const SETTINGS_DEFAULTS: AppSettings = {
  autoStart: true,
  autoLoginOnLaunch: true,
  viewMode: 'minimal',
  calendarShowDiff: true,
  automatePunch: false,
  punchTimes: DEFAULT_PUNCH,
  lunchAlarm: false,
  lunchAlarmTime: '12:00',
  moodNotification: false,
  moodNotificationTime: '09:30',
  kudocardNotification: false,
  kudocardFrequency: 'once',
  kudocardDays: [],
  pjAlarm: false,
  pjAlarmDay: 1,
  pjAlarmTime: '09:00',
  hoursPerDay: 8,
  hourRate: 0,
  showOvertimeValue: true,
  showTotalSalary: true,
  patchJournal: '',
  uiSounds: false,
};

/**
 * Rótulos dos horários do alerta diário — mesmos nomes da grade do timesheet e do
 * i18n do Beefor (`Entrada`, `Int 1`, `Ret 1`, `Saída`). Nada de "ponto"/"almoço":
 * quem usa o app é prestador e lança horas, não bate ponto.
 */
export const PUNCH_LABELS = ['Entrada', 'Int. 1', 'Ret. 1', 'Saída'];

/** Ícone por horário — o intervalo leva o de comida, igual ao Beefor. */
export const PUNCH_ICONS = ['🟢', '🍽️', '🔵', '🔴'];

/** Mescla um snapshot parcial sobre os defaults (preenche campos novos sem perder os existentes). */
export function mergeSettings(partial: Partial<AppSettings> | null | undefined): AppSettings {
  return { ...SETTINGS_DEFAULTS, ...(partial ?? {}) };
}

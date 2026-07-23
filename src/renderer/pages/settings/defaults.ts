import type { AppSettings } from '@shared/types/index';

const DEFAULT_PUNCH: AppSettings['punchTimes'] = ['09:00', '12:00', '13:00', '18:00'];

export const SETTINGS_DEFAULTS: AppSettings = {
  autoStart: true,
  autoLoginOnLaunch: true,
  viewMode: 'minimal',
  calendarShowDiff: true,
  automatePunch: false,
  punchTimes: DEFAULT_PUNCH,
  punchDriftMinutes: 10,
  lunchAlarm: false,
  lunchAlarmTime: '12:00',
  moodNotification: false,
  moodNotificationTime: '09:30',
  moodAlarm: false,
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

export const PUNCH_LABELS = ['Entrada', 'Saída almoço', 'Retorno', 'Saída'];

/** Mescla um snapshot parcial sobre os defaults (preenche campos novos sem perder os existentes). */
export function mergeSettings(partial: Partial<AppSettings> | null | undefined): AppSettings {
  return { ...SETTINGS_DEFAULTS, ...(partial ?? {}) };
}

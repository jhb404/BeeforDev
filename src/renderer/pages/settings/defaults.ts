import type { AppSettings } from '@shared/types';

const DEFAULT_PUNCH: AppSettings['punchTimes'] = ['09:00', '12:00', '13:00', '18:00'];

export const SETTINGS_DEFAULTS: AppSettings = {
  autoStart: true,
  autoLoginOnLaunch: true,
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
  hoursPerDay: 8,
  hourRate: 0,
  patchJournal: '',
  uiSounds: false,
};

export const PUNCH_LABELS = ['Entrada', 'Saída almoço', 'Retorno', 'Saída'];

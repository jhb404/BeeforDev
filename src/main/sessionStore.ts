import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { SESSION_FILE, SETTINGS_FILE } from '../shared/constants';
import type { AppSettings } from '../shared/types';
import { logger } from './logger';

const DEFAULT_SETTINGS: AppSettings = {
  autoStart: true,
  autoLoginOnLaunch: true,

  automatePunch: false,
  punchTimes: ['09:00', '12:00', '13:00', '18:00'],
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
  patchJournal:
    '- v0.1.0: base de lancamentos e mood.\n- v0.1.1: melhorias visuais e alertas.',
};

export function sessionPath(): string {
  return path.join(app.getPath('userData'), SESSION_FILE);
}

export function settingsPath(): string {
  return path.join(app.getPath('userData'), SETTINGS_FILE);
}

export async function sessionExists(): Promise<boolean> {
  try {
    await fs.access(sessionPath());
    return true;
  } catch {
    return false;
  }
}

export async function clearSession(): Promise<void> {
  try {
    await fs.unlink(sessionPath());
    logger.info('Session file removed');
  } catch (err: any) {
    if (err?.code !== 'ENOENT') logger.warn(`clearSession: ${err?.message}`);
  }
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(settingsPath(), 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(s: AppSettings): Promise<void> {
  await fs.writeFile(settingsPath(), JSON.stringify(s, null, 2), 'utf-8');
}

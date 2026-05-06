import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { SESSION_FILE, SETTINGS_FILE } from '../shared/constants';
import type { AppSettings } from '../shared/types';
import { logger } from './logger';

const FALLBACK_PATCH_JOURNAL = '- v0.1.0: base de lançamentos e mood.';

function patchJournalPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'patch-journal.md');
  }
  return path.join(app.getAppPath(), 'patch-journal.md');
}

async function readPatchJournal(): Promise<string> {
  try {
    const txt = await fs.readFile(patchJournalPath(), 'utf-8');
    return txt.trim() || FALLBACK_PATCH_JOURNAL;
  } catch (err: any) {
    logger.warn(`patch-journal read failed: ${err?.message}`);
    return FALLBACK_PATCH_JOURNAL;
  }
}

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
  patchJournal: FALLBACK_PATCH_JOURNAL,
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
  const journal = await readPatchJournal();
  try {
    const raw = await fs.readFile(settingsPath(), 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed, patchJournal: journal };
  } catch {
    return { ...DEFAULT_SETTINGS, patchJournal: journal };
  }
}

export async function saveSettings(s: AppSettings): Promise<void> {
  const { patchJournal: _omit, ...rest } = s;
  await fs.writeFile(settingsPath(), JSON.stringify(rest, null, 2), 'utf-8');
}

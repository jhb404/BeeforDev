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
  lunchAlarm: false,
  moodNotification: false,
  kudocardNotification: false,
  adjustInitialLayout: true,
  hoursPerDay: 8,
  hourRate: 0,
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

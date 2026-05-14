import { app } from 'electron';
import path from 'node:path';
import { logger } from './logger';

/**
 * Registers app to run at login.
 * Dev mode: skipped — `process.execPath` would point to node_modules/electron.exe,
 * which opens the "Electron sample" window on next boot.
 * Packaged: uses the installer-provided launcher (`updateExeName`) so Squirrel/NSIS
 * handles updates transparently.
 */
export function setAutoStart(enabled: boolean): void {
  if (!app.isPackaged) {
    logger.info(`Auto-start ignored in dev mode (would register electron.exe)`);
    return;
  }

  const exeName = path.basename(process.execPath);
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: false,
    path: process.execPath,
    args: ['--autostart'],
    name: 'BeeforU',
  });
  logger.info(`Auto-start ${enabled ? 'enabled' : 'disabled'} (exe: ${exeName})`);
}

export function isAutoStartEnabled(): boolean {
  if (!app.isPackaged) return false;
  return app.getLoginItemSettings().openAtLogin;
}

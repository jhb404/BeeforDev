import { app } from 'electron';
import { logger } from './logger';

export function setAutoStart(enabled: boolean): void {
  // works on Windows + macOS; no-op on Linux unless desktop file present
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: false,
    args: [],
  });
  logger.info(`Auto-start ${enabled ? 'enabled' : 'disabled'}`);
}

export function isAutoStartEnabled(): boolean {
  return app.getLoginItemSettings().openAtLogin;
}

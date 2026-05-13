import { app } from 'electron';
import { autoUpdater } from 'electron-updater';
import { logger } from './logger';

export function setupAutoUpdater() {
  if (!app.isPackaged) {
    logger.info('Auto-updater disabled (dev mode)');
    return;
  }

  autoUpdater.logger = logger as any;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;

  autoUpdater.on('checking-for-update', () => logger.info('Updater: checking'));
  autoUpdater.on('update-available', (info) =>
    logger.info(`Updater: update available v${info.version}`),
  );
  autoUpdater.on('update-not-available', () => logger.info('Updater: up to date'));
  autoUpdater.on('download-progress', (p) =>
    logger.info(`Updater: downloading ${p.percent.toFixed(1)}%`),
  );
  autoUpdater.on('update-downloaded', (info) =>
    logger.info(`Updater: downloaded v${info.version}; install on quit`),
  );
  autoUpdater.on('error', (err) =>
    logger.error(`Updater error: ${err instanceof Error ? err.message : String(err)}`),
  );

  // Check every 4h while app is running
  void autoUpdater.checkForUpdates();
  setInterval(() => void autoUpdater.checkForUpdates(), 4 * 60 * 60 * 1000);
}

import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { IPC } from '../shared/ipc';
import { logger } from './logger';

let registered = false;

export function setupAutoUpdater(getWindow: () => BrowserWindow | null) {
  if (!app.isPackaged) {
    logger.info('Auto-updater disabled (dev mode)');
    return;
  }

  autoUpdater.logger = logger as any;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;

  const send = (channel: string, payload: unknown) => {
    const win = getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  };

  autoUpdater.on('checking-for-update', () => logger.info('Updater: checking'));
  autoUpdater.on('update-available', (info) => {
    logger.info(`Updater: update available v${info.version}`);
    send(IPC.EVT_UPDATE_AVAILABLE, { version: info.version });
  });
  autoUpdater.on('update-not-available', () => logger.info('Updater: up to date'));
  autoUpdater.on('download-progress', (p) =>
    logger.info(`Updater: downloading ${p.percent.toFixed(1)}%`),
  );
  autoUpdater.on('update-downloaded', (info) => {
    logger.info(`Updater: downloaded v${info.version}; ready to install`);
    send(IPC.EVT_UPDATE_DOWNLOADED, { version: info.version });
  });
  autoUpdater.on('error', (err) =>
    logger.error(`Updater error: ${err instanceof Error ? err.message : String(err)}`),
  );

  if (!registered) {
    ipcMain.handle(IPC.UPDATER_QUIT_AND_INSTALL, () => {
      logger.info('Updater: quit and install requested');
      autoUpdater.quitAndInstall(false, true);
    });
    registered = true;
  }

  void autoUpdater.checkForUpdates();
  setInterval(() => void autoUpdater.checkForUpdates(), 4 * 60 * 60 * 1000);
}

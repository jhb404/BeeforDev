import { app, BrowserWindow } from 'electron';
import { createMainWindow } from './window';
import { registerIpcHandlers } from './ipcHandlers';
import { bindLoggerWindow, logger } from './logger';
import { loadSettings } from './sessionStore';
import { setAutoStart } from './autoStart';
import { BeeforClient } from '../automation/beefor/beeforClient';
import { ensureSession, startWatchdog, stopWatchdog } from './sessionManager';

let mainWindow: BrowserWindow | null = null;
const getWindow = () => mainWindow;

async function bootstrap() {
  await app.whenReady();

  mainWindow = createMainWindow();
  bindLoggerWindow(mainWindow);
  registerIpcHandlers(getWindow);

  const settings = await loadSettings();
  setAutoStart(settings.autoStart);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (settings.autoLoginOnLaunch) {
    void ensureSession(getWindow());
  }

  startWatchdog(getWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
      bindLoggerWindow(mainWindow);
    }
  });
}

app.on('window-all-closed', async () => {
  stopWatchdog();
  await BeeforClient.instance().close();
  if (process.platform !== 'darwin') app.quit();
});

bootstrap().catch((err) => {
  logger.error('Bootstrap failed', err);
  app.quit();
});

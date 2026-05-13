import { app, BrowserWindow } from 'electron';
import { createMainWindow } from './window';
import { registerIpcHandlers } from './ipcHandlers';
import { bindLoggerWindow, logger } from './logger';
import { loadSettings } from './sessionStore';
import { setAutoStart } from './autoStart';
import { BeeforClient } from '../automation/beefor/beeforClient';
import { ensureSession, startWatchdog, stopWatchdog } from './sessionManager';
import { startScheduler, stopScheduler } from './scheduler';
import { initCoin2u } from './coin2uClient';
import { createStartupSplash } from './startupSplash';
import { revealMainWindow } from './bootstrap/windowReveal';
import { ensureTray } from './bootstrap/tray';
import { setupAutoUpdater } from './updater';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;
let ipcRegistered = false;
const getWindow = () => mainWindow;

function ensureIpcHandlers() {
  if (ipcRegistered) return;
  registerIpcHandlers(getWindow);
  ipcRegistered = true;
}

function wireMainWindow(win: BrowserWindow) {
  win.on('close', (event) => {
    if (isQuitting) return;
    event.preventDefault();
    win.hide();
  });
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = createMainWindow();
    bindLoggerWindow(mainWindow);
    wireMainWindow(mainWindow);
    void revealMainWindow(mainWindow);
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

async function bootstrap() {
  await app.whenReady();
  app.setName('Beefor U');
  if (process.platform === 'win32') {
    app.setAppUserModelId('io.beefor.dev');
  }

  const splash = createStartupSplash('orange');
  const settings = await loadSettings();
  const variant = settings.logoVariant ?? 'orange';

  ensureIpcHandlers();
  mainWindow = createMainWindow(variant);
  bindLoggerWindow(mainWindow);
  wireMainWindow(mainWindow);
  ensureTray({
    variant,
    getWindow,
    onShowWindow: showMainWindow,
    onQuit: () => {
      isQuitting = true;
    },
  });

  setAutoStart(settings.autoStart);
  void initCoin2u().catch((err) => {
    logger.warn(`Coin2U init failed: ${err instanceof Error ? err.message : String(err)}`);
  });
  if (settings.autoLoginOnLaunch) {
    void ensureSession(getWindow());
  }

  void revealMainWindow(mainWindow, splash).then(() => {
    startWatchdog(getWindow);
    startScheduler(getWindow);
    setupAutoUpdater();
  });

  app.on('activate', () => {
    showMainWindow();
  });
}

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', async () => {
  stopWatchdog();
  stopScheduler();
  await BeeforClient.instance().close();
  if (process.platform !== 'darwin') app.quit();
});

bootstrap().catch((err) => {
  logger.error('Bootstrap failed', err);
  app.quit();
});

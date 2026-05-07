import { Notification, app, BrowserWindow, Menu, Tray } from 'electron';
import type { Page } from 'playwright';
import { createMainWindow, getBuildIconPath } from './window';
import { registerIpcHandlers } from './ipcHandlers';
import { bindLoggerWindow, logger } from './logger';
import { loadSettings } from './sessionStore';
import { setAutoStart } from './autoStart';
import { BeeforClient } from '../automation/beefor/beeforClient';
import {
  doAutoLancamento,
  doGetCurrentMood,
  doSelectMood,
} from '../automation/beefor/beeforActions';
import { withPageLock } from '../automation/beefor/pageLock';
import { IPC } from '../shared/ipc';
import { MOODS, type Mood } from '../shared/types';
import { ensureSessionForAction, forceReconnect } from './sessionGuard';
import { ensureSession, startWatchdog, stopWatchdog } from './sessionManager';
import { startScheduler, stopScheduler } from './scheduler';
import { initCoin2u } from './coin2uClient';
import { closeStartupSplash, createStartupSplash } from './startupSplash';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let ipcRegistered = false;
const getWindow = () => mainWindow;

async function waitForFirstPaint(win: BrowserWindow): Promise<void> {
  if (win.isDestroyed()) return;
  if (!win.webContents.isLoading()) return;
  await new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer);
      win.webContents.removeListener('did-fail-load', done);
      win.webContents.removeListener('did-finish-load', done);
      win.removeListener('ready-to-show', done);
      resolve();
    };
    const timer = setTimeout(done, 3500);
    win.once('ready-to-show', done);
    win.webContents.once('did-finish-load', done);
    win.webContents.once('did-fail-load', done);
  });
}

async function revealMainWindow(win: BrowserWindow, splash: BrowserWindow | null = null) {
  await waitForFirstPaint(win);
  if (win.isDestroyed()) return;

  win.setOpacity(0);
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  await closeStartupSplash(splash);

  const steps = 10;
  for (let i = 1; i <= steps; i += 1) {
    if (win.isDestroyed()) return;
    win.setOpacity(i / steps);
    await new Promise((resolve) => setTimeout(resolve, 18));
  }
  if (!win.isDestroyed()) win.setOpacity(1);
}

function ensureIpcHandlers() {
  if (ipcRegistered) return;
  registerIpcHandlers(getWindow);
  ipcRegistered = true;
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

function ensureTray(variant: 'orange' | 'purple' = 'orange') {
  if (tray) return;
  const iconPath = getBuildIconPath(variant);
  tray = new Tray(iconPath);
  tray.setToolTip('Beefor U');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Abrir', click: () => showMainWindow() },
      { type: 'separator' },
      {
        label: 'Auto lancamento',
        click: () => {
          void runAutoLancamentoFromTray();
        },
      },
      {
        label: 'Escolher mood',
        submenu: MOODS.map((mood) => ({
          label: mood,
          click: () => {
            void runMoodFromTray(mood);
          },
        })),
      },
      { type: 'separator' },
      {
        label: 'Sair',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]),
  );
  tray.on('click', () => showMainWindow());
  tray.on('double-click', () => showMainWindow());
}

function notifyWindows(title: string, body: string) {
  try {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
      return;
    }
  } catch (err) {
    logger.warn(
      `Notification failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  logger.info(`[NOTIFY] ${title} - ${body}`);
}

async function runActionWithReconnect<T>(action: (page: Page) => Promise<T>): Promise<T> {
  const win = getWindow();
  await ensureSessionForAction(win);
  try {
    return await withPageLock(async () => {
      const page = await BeeforClient.instance().getPage();
      return action(page);
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/sess|timeout/i.test(msg)) {
      await forceReconnect(win);
      return withPageLock(async () => {
        const page = await BeeforClient.instance().getPage();
        return action(page);
      });
    }
    throw err;
  }
}

async function runAutoLancamentoFromTray() {
  const title = 'Auto lancamento';
  try {
    notifyWindows('Beefor U', `${title} iniciado.`);
    await runActionWithReconnect(async (page) => {
      await doAutoLancamento(page);
    });
    notifyWindows('Beefor U', `${title} concluido com sucesso.`);
    const win = getWindow();
    win?.webContents.send(IPC.EVT_NOTIFY, {
      title: 'sync:autoLancamento',
      body: 'ok',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`${title} via tray falhou`, err);
    notifyWindows('Beefor U', `${title} falhou: ${msg}`);
  }
}

async function runMoodFromTray(mood: Mood) {
  const title = 'Escolher mood';
  try {
    const changed = await runActionWithReconnect(async (page) => {
      const before = await doGetCurrentMood(page);
      await doSelectMood(page, mood);
      const after = await doGetCurrentMood(page);
      return before !== after && after === mood;
    });
    if (changed) {
      notifyWindows('Beefor U', `Mood aplicado: ${mood}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Mood via tray falhou (${mood})`, err);
    notifyWindows('Beefor U', `${title} falhou: ${msg}`);
  }
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
  ensureTray(variant);

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

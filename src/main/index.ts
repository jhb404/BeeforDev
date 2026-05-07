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

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
const getWindow = () => mainWindow;

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = createMainWindow();
    bindLoggerWindow(mainWindow);
    wireMainWindow(mainWindow);
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

  const settings = await loadSettings();
  const variant = settings.logoVariant ?? 'orange';

  mainWindow = createMainWindow(variant);
  bindLoggerWindow(mainWindow);
  wireMainWindow(mainWindow);
  registerIpcHandlers(getWindow);
  ensureTray(variant);

  setAutoStart(settings.autoStart);

  // Hydrate Coin2U session from disk so badge works without manual re-login
  await initCoin2u();

  if (settings.autoLoginOnLaunch) {
    void ensureSession(getWindow());
  }

  startWatchdog(getWindow);
  startScheduler(getWindow);

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

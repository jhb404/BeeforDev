import { app, BrowserWindow, session } from 'electron';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { createMainWindow, getBuildIconPath } from './window';
import { installCsp } from './csp';
import { registerIpcHandlers } from './ipc';
import { bindLoggerWindow, logger } from './logger';
import { loadSettings } from './sessionStore';
import { setAutoStart } from './autoStart';
import { ensureSession, startWatchdog, stopWatchdog } from './sessionManager';
import { startScheduler, stopScheduler } from './scheduler/index';
import { initCoin2u } from './coin2u';
import { createStartupSplash } from './startupSplash';
import { revealMainWindow } from './bootstrap/windowReveal';
import { ensureTray } from './bootstrap/tray';
import { setupAutoUpdater } from './updater';
import { stopTunnel } from './services/tunnelManager';

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

function removeMacQuarantine(): void {
  if (process.platform !== 'darwin' || !app.isPackaged) return;
  try {
    // process.execPath = <bundle>.app/Contents/MacOS/<bin> — go up 3 levels to get .app
    const appBundle = path.dirname(path.dirname(path.dirname(process.execPath)));
    execSync(`xattr -cr "${appBundle.replace(/"/g, '\\"')}"`, { timeout: 5000 });
  } catch {
    // non-fatal
  }
}

async function bootstrap() {
  await app.whenReady();
  removeMacQuarantine();
  app.setName('Beefor U');
  if (process.platform === 'win32') {
    app.setAppUserModelId('io.beefor.dev');
  }

  // CSP only in production, with BEEFOR_CSP=0 as emergency rollback switch.
  if (process.env.NODE_ENV !== 'development' && process.env.BEEFOR_CSP !== '0') {
    installCsp(false);
  }

  // Deny every Web permission request (notifications, geolocation, media, USB, etc).
  // App talks to the OS only via main-process IPC, so the renderer never needs these.
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, cb) => cb(false));
  session.defaultSession.setPermissionCheckHandler(() => false);

  const splash = createStartupSplash('orange');
  const settings = await loadSettings();
  const variant = settings.logoVariant ?? 'orange';

  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(getBuildIconPath(variant));
  }

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
    setupAutoUpdater(getWindow);
  });

  app.on('activate', () => {
    showMainWindow();
  });
}

app.on('before-quit', () => {
  isQuitting = true;
  stopTunnel();
});

app.on('window-all-closed', async () => {
  stopWatchdog();
  stopScheduler();
  if (process.platform !== 'darwin') app.quit();
});

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  bootstrap().catch((err) => {
    logger.error('Bootstrap failed', err);
    app.quit();
  });
}

import { Menu, Tray, app } from 'electron';
import type { BrowserWindow, MenuItemConstructorOptions } from 'electron';
import { DEFAULT_TRAY_MENU, MOODS, type TrayMenuItem } from '../../shared/types';
import { IPC } from '../../shared/ipc';
import { getBuildIconPath } from '../window';
import { loadSettings } from '../sessionStore';
import { runAutoLancamentoFromTray, runMoodFromTray } from './trayActions';
import { logger } from '../logger';

interface TrayOptions {
  variant?: 'orange' | 'purple';
  onShowWindow: () => void;
  onQuit: () => void;
  getWindow: () => BrowserWindow | null;
}

let trayRef: Tray | null = null;
let lastOpts: TrayOptions | null = null;
let lunchTimerActive = false;

function buildMenuTemplate(items: TrayMenuItem[], opts: TrayOptions): MenuItemConstructorOptions[] {
  return items.map((item) => {
    switch (item.type) {
      case 'open':
        return { label: 'Abrir', click: () => opts.onShowWindow() };
      case 'autoLancamento':
        return {
          label: 'Auto lancamento',
          click: () => void runAutoLancamentoFromTray(opts.getWindow()),
        };
      case 'mood':
        return {
          label: 'Escolher mood',
          submenu: MOODS.map((mood) => ({
            label: mood,
            click: () => void runMoodFromTray(opts.getWindow(), mood),
          })),
        };
      case 'openBeefor':
        return { label: 'Abrir Beefor', click: () => opts.onShowWindow() };
      case 'logout':
        return { label: 'Logout', click: () => opts.onShowWindow() };
      case 'separator':
        return { type: 'separator' };
      case 'quit':
        return {
          label: 'Sair',
          click: () => {
            opts.onQuit();
            app.quit();
          },
        };
      case 'lunchTimer':
        return {
          label: lunchTimerActive ? '⏱ Timer ativo...' : 'Timer de almoço (1h)',
          enabled: !lunchTimerActive,
          click: () => opts.getWindow()?.webContents.send(IPC.EVT_TRAY_LUNCH_TIMER),
        };
      case 'sendKudo':
        return {
          label: 'Enviar KudoCard',
          click: () => {
            opts.onShowWindow();
            opts.getWindow()?.webContents.send(IPC.EVT_TRAY_OPEN_KUDO);
          },
        };
      case 'sendCoins':
        return {
          label: 'Enviar coins',
          click: () => {
            opts.onShowWindow();
            opts.getWindow()?.webContents.send(IPC.EVT_TRAY_OPEN_COINS);
          },
        };
      default:
        return { type: 'separator' };
    }
  });
}

export function setLunchTimerActive(active: boolean): void {
  lunchTimerActive = active;
  void rebuildTrayMenu();
}

export async function rebuildTrayMenu(): Promise<void> {
  if (!trayRef || !lastOpts) return;
  const settings = await loadSettings();
  const items =
    settings.trayMenu && settings.trayMenu.length > 0 ? settings.trayMenu : DEFAULT_TRAY_MENU;
  try {
    trayRef.setContextMenu(Menu.buildFromTemplate(buildMenuTemplate(items, lastOpts)));
  } catch (err) {
    logger.warn(`Tray rebuild failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function ensureTray(opts: TrayOptions): Tray {
  if (trayRef) return trayRef;
  lastOpts = opts;

  const variant = opts.variant ?? 'orange';
  const iconPath = getBuildIconPath(variant);
  const tray = new Tray(iconPath);
  tray.setToolTip('Beefor U');

  // Build initial menu with defaults, async upgrade after settings load
  tray.setContextMenu(Menu.buildFromTemplate(buildMenuTemplate(DEFAULT_TRAY_MENU, opts)));

  void loadSettings().then((settings) => {
    if (settings.trayMenu && settings.trayMenu.length > 0) {
      tray.setContextMenu(Menu.buildFromTemplate(buildMenuTemplate(settings.trayMenu, opts)));
    }
  });

  tray.on('click', () => opts.onShowWindow());
  tray.on('double-click', () => opts.onShowWindow());
  trayRef = tray;
  return tray;
}

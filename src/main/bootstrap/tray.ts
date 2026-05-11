import { Menu, Tray, app } from 'electron';
import type { BrowserWindow } from 'electron';
import { MOODS } from '../../shared/types';
import { getBuildIconPath } from '../window';
import { runAutoLancamentoFromTray, runMoodFromTray } from './trayActions';

interface TrayOptions {
  variant?: 'orange' | 'purple';
  onShowWindow: () => void;
  onQuit: () => void;
  getWindow: () => BrowserWindow | null;
}

let trayRef: Tray | null = null;

export function ensureTray(opts: TrayOptions): Tray {
  if (trayRef) return trayRef;

  const variant = opts.variant ?? 'orange';
  const iconPath = getBuildIconPath(variant);
  const tray = new Tray(iconPath);
  tray.setToolTip('Beefor U');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Abrir', click: () => opts.onShowWindow() },
      { type: 'separator' },
      {
        label: 'Auto lancamento',
        click: () => {
          void runAutoLancamentoFromTray(opts.getWindow());
        },
      },
      {
        label: 'Escolher mood',
        submenu: MOODS.map((mood) => ({
          label: mood,
          click: () => {
            void runMoodFromTray(opts.getWindow(), mood);
          },
        })),
      },
      { type: 'separator' },
      {
        label: 'Sair',
        click: () => {
          opts.onQuit();
          app.quit();
        },
      },
    ]),
  );
  tray.on('click', () => opts.onShowWindow());
  tray.on('double-click', () => opts.onShowWindow());
  trayRef = tray;
  return tray;
}

import type { BrowserWindow } from 'electron';
import { closeStartupSplash } from '../startupSplash';

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

/**
 * Fades the main window in after the first paint, then closes the splash.
 * Safe against window destruction mid-animation.
 */
export async function revealMainWindow(
  win: BrowserWindow,
  splash: BrowserWindow | null = null,
): Promise<void> {
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

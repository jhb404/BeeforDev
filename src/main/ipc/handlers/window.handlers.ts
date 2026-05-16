import type { BrowserWindow } from 'electron';
import { nativeImage } from 'electron';
import { IPC } from '../../../shared/ipc/index';
import { defineEventHandler } from '../defineHandler';

export function registerWindowHandlers(getWindow: () => BrowserWindow | null) {
  defineEventHandler({
    channel: IPC.WIN_MINIMIZE,
    errorMessage: 'Window minimize failed',
    run: () => getWindow()?.minimize(),
  });

  defineEventHandler({
    channel: IPC.WIN_MAXIMIZE,
    errorMessage: 'Window maximize failed',
    run: () => {
      const win = getWindow();
      if (!win) return;
      win.isMaximized() ? win.unmaximize() : win.maximize();
    },
  });

  defineEventHandler({
    channel: IPC.WIN_CLOSE,
    errorMessage: 'Window close failed',
    run: () => getWindow()?.hide(),
  });

  defineEventHandler({
    channel: IPC.WIN_SET_ICON,
    errorMessage: 'Window set icon failed',
    run: ({ args }) => {
      const dataUrl = args[0];
      const win = getWindow();
      if (!win || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return;
      const img = nativeImage.createFromDataURL(dataUrl);
      if (!img.isEmpty()) win.setIcon(img);
    },
  });
}

import { BrowserWindow, ipcMain, nativeImage } from 'electron';
import { IPC } from '../../../shared/ipc';

export function registerWindowHandlers(getWindow: () => BrowserWindow | null) {
  ipcMain.on(IPC.WIN_MINIMIZE, () => getWindow()?.minimize());
  ipcMain.on(IPC.WIN_MAXIMIZE, () => {
    const win = getWindow();
    if (!win) return;
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });
  ipcMain.on(IPC.WIN_CLOSE, () => getWindow()?.hide());

  // Renderer rasterizes BeeforLogo SVG to PNG (canvas → toDataURL), sends data URL here.
  // Main converts to nativeImage and applies to window — appears in taskbar + alt-tab.
  ipcMain.on(IPC.WIN_SET_ICON, (_e, dataUrl: string) => {
    const win = getWindow();
    if (!win || !dataUrl?.startsWith('data:image/')) return;
    try {
      const img = nativeImage.createFromDataURL(dataUrl);
      if (!img.isEmpty()) win.setIcon(img);
    } catch {
      /* ignore — keep existing icon */
    }
  });
}

import { BrowserWindow, ipcMain } from 'electron';
import { IPC } from '../../../shared/ipc';

export function registerWindowHandlers(getWindow: () => BrowserWindow | null) {
  ipcMain.on(IPC.WIN_MINIMIZE, () => getWindow()?.minimize());
  ipcMain.on(IPC.WIN_MAXIMIZE, () => {
    const win = getWindow();
    if (!win) return;
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });
  ipcMain.on(IPC.WIN_CLOSE, () => getWindow()?.hide());
}

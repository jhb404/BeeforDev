import { BrowserWindow, shell } from 'electron';
import path from 'node:path';

export function createMainWindow(): BrowserWindow {
  const isDev = process.env.NODE_ENV === 'development';
  const iconPath = path.join(__dirname, '../../build/icon.png');

  const win = new BrowserWindow({
    title: 'Beefor Dev',
    width: 950,
    height: 950,
    minWidth: 720,
    minHeight: 520,
    backgroundColor: '#0a0d12',
    autoHideMenuBar: true,
    frame: false,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5177');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return win;
}

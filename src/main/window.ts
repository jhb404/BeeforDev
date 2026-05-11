import { app, BrowserWindow, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

type LogoVariant = 'orange' | 'purple';

function existingBuildDirCandidates(): string[] {
  if (app.isPackaged) {
    return [
      path.join(process.resourcesPath, 'build'),
      path.join(app.getAppPath(), 'build'),
      path.join(__dirname, '../../build'),
    ];
  }
  return [
    path.join(app.getAppPath(), 'build'),
    path.join(__dirname, '../../build'),
  ];
}

export function getBuildAssetsDir(): string {
  const candidates = existingBuildDirCandidates();
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0];
}

export function getBuildAssetPath(fileName: string): string {
  return path.join(getBuildAssetsDir(), path.basename(fileName));
}

function pickFirstExistingAsset(files: string[]): string {
  for (const file of files) {
    if (fs.existsSync(getBuildAssetPath(file))) return file;
  }
  return files[files.length - 1];
}

export function getBuildIconPath(variant: LogoVariant = 'orange'): string {
  const preferred =
    variant === 'purple'
      ? ['icon-purple.png', 'logo-app-purple.png']
      : ['icon-orange.png', 'logo-app-orange.png'];

  const file = pickFirstExistingAsset([
    ...preferred,
    'icon.png',
    'icon-256.png',
    'icon-512.png',
  ]);

  return getBuildAssetPath(file);
}

export function createMainWindow(variant: LogoVariant = 'orange'): BrowserWindow {
  const isDev = process.env.NODE_ENV === 'development';
  const iconPath = getBuildIconPath(variant);

  const win = new BrowserWindow({
    title: 'Beefor U',
    width: 950,
    height: 910,
    minWidth: 720,
    minHeight: 520,
    backgroundColor: '#0a0d12',
    show: false,
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
    if (process.env.BEEFOR_DEVTOOLS === '1') {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return win;
}

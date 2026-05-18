import { app, BrowserWindow, nativeImage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { openExternalSafe } from './openSafe';

type LogoVariant = 'orange' | 'purple';

function existingBuildDirCandidates(): string[] {
  if (app.isPackaged) {
    return [
      path.join(process.resourcesPath, 'build'),
      path.join(app.getAppPath(), 'build'),
      path.join(__dirname, '../../build'),
    ];
  }
  return [path.join(app.getAppPath(), 'build'), path.join(__dirname, '../../build')];
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

  const file = pickFirstExistingAsset([...preferred, 'icon.png', 'icon-256.png', 'icon-512.png']);

  return getBuildAssetPath(file);
}

export function getTrayIcon(variant: LogoVariant = 'orange') {
  if (process.platform === 'darwin') {
    // Prefer RGBA PNGs — icon-16.png uses indexed colormap which can fail on macOS
    const candidates = ['icon-32.png', 'icon-64.png', 'icon-128.png', 'icon-256.png', 'icon.png'];
    for (const candidate of candidates) {
      const p = getBuildAssetPath(candidate);
      if (fs.existsSync(p)) {
        return nativeImage.createFromPath(p).resize({ width: 16, height: 16 });
      }
    }
  }
  return getBuildIconPath(variant);
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
      // Preload is bundled by scripts/build-preload.mjs into a single CJS file,
      // so sandboxed renderers can load it without cross-directory requires.
      sandbox: true,
      // Blocks middle-click on links from spawning new windows that bypass our
      // setWindowOpenHandler — flagged by Electronegativity AUXCLICK_JS_CHECK.
      disableBlinkFeatures: 'Auxclick',
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5177');
    if (process.env.BEEFOR_DEVTOOLS === '1') {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
    if (process.env.BEEFOR_DEVTOOLS === '1') {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  }

  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error(`[renderer] did-fail-load code=${code} desc=${desc} url=${url}`);
  });
  win.webContents.on('render-process-gone', (_e, details) => {
    console.error(
      `[renderer] render-process-gone reason=${details.reason} exitCode=${details.exitCode}`,
    );
  });
  win.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    if (level >= 2) {
      console.error(`[renderer console] ${message} (${sourceId}:${line})`);
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    void openExternalSafe(url);
    return { action: 'deny' };
  });

  // Renderer must stay on its own origin. Anything else (e.g. an XSS payload
  // pushing location.href to an attacker URL) is routed to the OS browser
  // after passing the openExternalSafe allow-list (https + mailto only).
  win.webContents.on('will-navigate', (event, url) => {
    const allowed = url.startsWith('http://localhost:5177') || url.startsWith('file://');
    if (!allowed) {
      event.preventDefault();
      void openExternalSafe(url);
    }
  });

  return win;
}

import { BrowserWindow, app, ipcMain } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { IPC } from '../../../shared/ipc';
import { isElevated, relaunchAsAdmin } from '../../adminCheck';
import { fireTestNotification, getTodayAlerts } from '../../scheduler';
import { getBuildAssetPath, getBuildAssetsDir } from '../../window';
import { logger } from '../../logger';
import { ok, fail } from '../../services/result';

export function registerSystemHandlers(getWindow: () => BrowserWindow | null) {
  ipcMain.handle(IPC.ADMIN_STATUS, async () => ({
    elevated: isElevated(),
    platform: process.platform,
  }));

  ipcMain.handle(IPC.ADMIN_RELAUNCH, async () => {
    try {
      await relaunchAsAdmin();
      return ok();
    } catch (err) {
      logger.error('Relaunch as admin failed', err);
      return fail(err);
    }
  });

  ipcMain.handle(IPC.APP_RELAUNCH, async () => {
    try {
      app.relaunch();
      app.exit(0);
      return ok();
    } catch (err) {
      logger.error('App relaunch failed', err);
      return fail(err);
    }
  });

  ipcMain.handle(IPC.NOTIFY_TEST, async (_e, kind: 'mood' | 'lunch' | 'kudocard' | 'punch') => {
    try {
      fireTestNotification(getWindow(), kind);
      return ok();
    } catch (err) {
      return fail(err);
    }
  });

  ipcMain.handle(IPC.ACTION_GET_TODAY_ALERTS, async () => {
    try {
      const alerts = await getTodayAlerts();
      return ok(alerts);
    } catch (err) {
      return fail(err);
    }
  });

  ipcMain.handle(IPC.APP_GET_ASSET_PATH, () => {
    return getBuildAssetsDir();
  });

  ipcMain.handle(IPC.APP_READ_ASSET, async (_e, fileName: string) => {
    const safe = path.basename(fileName);
    const fullPath = getBuildAssetPath(safe);
    try {
      const buf = await fs.readFile(fullPath);
      const ext = path.extname(safe).slice(1).toLowerCase() || 'png';
      return `data:image/${ext};base64,${buf.toString('base64')}`;
    } catch (err) {
      logger.warn(
        `readAsset failed for ${safe}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  });
}

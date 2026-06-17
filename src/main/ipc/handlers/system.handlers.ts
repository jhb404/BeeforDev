import type { BrowserWindow } from 'electron';
import { app, clipboard } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { IPC } from '../../../shared/ipc/index';
import { isElevated, relaunchAsAdmin } from '../../adminCheck';
import { fireTestNotification, getTodayAlerts } from '../../scheduler/index';
import { getBuildAssetPath, getBuildAssetsDir } from '../../window';
import { setLunchTimerActive } from '../../bootstrap/tray';
import { notifyWindows } from '../../bootstrap/notifications';
import { logger } from '../../logger';
import { ok } from '../../../shared/result';
import { assetFileNameSchema, notifyTestKindSchema, notifyWindowsArgsSchema } from '../schemas';
import { defineEventHandler, defineHandler } from '../defineHandler';

export function registerSystemHandlers(getWindow: () => BrowserWindow | null) {
  defineHandler({
    channel: IPC.ADMIN_STATUS,
    errorMessage: 'Admin status failed',
    run: () => ({
      elevated: isElevated(),
      platform: process.platform,
    }),
  });

  defineHandler({
    channel: IPC.ADMIN_RELAUNCH,
    errorMessage: 'Relaunch as admin failed',
    run: async () => {
      await relaunchAsAdmin();
      return ok();
    },
  });

  defineHandler({
    channel: IPC.APP_RELAUNCH,
    errorMessage: 'App relaunch failed',
    run: () => {
      app.relaunch();
      app.exit(0);
      return ok();
    },
  });

  defineHandler({
    channel: IPC.NOTIFY_TEST,
    schema: notifyTestKindSchema,
    errorMessage: 'Test notification failed',
    run: ({ data }) => {
      fireTestNotification(getWindow(), data);
      return ok();
    },
  });

  defineHandler({
    channel: IPC.ACTION_GET_TODAY_ALERTS,
    errorMessage: 'Get today alerts failed',
    run: async () => {
      const alerts = await getTodayAlerts();
      return ok(alerts);
    },
  });

  defineHandler({
    channel: IPC.APP_GET_ASSET_PATH,
    errorMessage: 'Get asset path failed',
    run: () => getBuildAssetsDir(),
  });

  defineHandler({
    channel: IPC.CLIPBOARD_WRITE,
    schema: z.string(),
    errorMessage: 'Clipboard write failed',
    run: ({ data }) => {
      clipboard.writeText(data);
      return ok();
    },
  });

  defineEventHandler({
    channel: IPC.TRAY_SET_LUNCH_ACTIVE,
    schema: z.boolean(),
    errorMessage: 'Set lunch timer active failed',
    run: ({ data }) => {
      setLunchTimerActive(data);
    },
  });

  defineHandler({
    channel: IPC.ACTION_NOTIFY,
    schema: notifyWindowsArgsSchema,
    payload: (args) => args,
    errorMessage: 'Notify Windows failed',
    run: ({ data }) => {
      const [title, body, variant] = data;
      notifyWindows(title, body, variant);
      return ok();
    },
  });

  defineHandler({
    channel: IPC.APP_READ_ASSET,
    schema: assetFileNameSchema,
    errorMessage: 'Read asset failed',
    run: async ({ data }) => {
      const safe = path.basename(data);
      const fullPath = getBuildAssetPath(safe);
      try {
        const buf = await fs.readFile(fullPath);
        const ext = path.extname(safe).slice(1).toLowerCase() || 'png';
        return `data:image/${ext};base64,${buf.toString('base64')}`;
      } catch (err) {
        // Missing assets are expected during fallback chains in `useAppLogo`.
        // Demote ENOENT to debug to avoid console noise; only warn on real I/O errors.
        const code = (err as NodeJS.ErrnoException)?.code;
        const msg = err instanceof Error ? err.message : String(err);
        if (code === 'ENOENT') {
          logger.debug(`readAsset miss: ${safe}`);
        } else {
          logger.warn(`readAsset failed for ${safe}: ${msg}`);
        }
        return null;
      }
    },
  });
}

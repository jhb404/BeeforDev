import { BrowserWindow, app, ipcMain, shell } from 'electron';
import { IPC } from '../shared/ipc';
import type {
  ActionResult,
  AppSettings,
  Credentials,
  Mood,
  TimesheetEntry,
} from '../shared/types';
import { emitStatus, getCurrentStatus } from './statusBus';
import {
  clearCredentials,
  getCredentials,
  saveCredentials,
} from './secureStorage';
import {
  clearSession,
  loadSettings,
  saveSettings,
  sessionPath,
} from './sessionStore';
import { setAutoStart } from './autoStart';
import { logger } from './logger';
import { BEEFOR_LOGIN_URL } from '../shared/constants';
import { BeeforClient } from '../automation/beefor/beeforClient';
import {
  performLogin,
  doAutoLancamento,
  doSelectMood,
  doVerifySession,
  doLogout,
  doLancarHora,
  doFetchTimesheet,
  doGetCurrentMood,
} from '../automation/beefor/beeforActions';
import { withPageLock } from '../automation/beefor/pageLock';
import { ensureSessionForAction, forceReconnect } from './sessionGuard';
import { isElevated, relaunchAsAdmin } from './adminCheck';
import { fireTestNotification, getTodayAlerts } from './scheduler';

function ok<T>(data?: T): ActionResult<T> {
  return { ok: true, data };
}
function fail(error: unknown): ActionResult {
  const msg = error instanceof Error ? error.message : String(error);
  return { ok: false, error: msg };
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) =>
      setTimeout(() => rej(new Error(`${label}: timeout após ${ms}ms`)), ms),
    ),
  ]);
}

export function registerIpcHandlers(getWindow: () => BrowserWindow | null) {
  const client = BeeforClient.instance();

  ipcMain.handle(IPC.CREDS_SAVE, async (_e, creds: Credentials) => {
    try {
      await saveCredentials(creds);
      return ok();
    } catch (err) {
      return fail(err);
    }
  });

  ipcMain.handle(IPC.CREDS_GET, async () => {
    const c = await getCredentials();
    return c ? { email: c.email } : null;
  });

  ipcMain.handle(IPC.CREDS_CLEAR, async () => {
    try {
      await clearCredentials();
      return ok();
    } catch (err) {
      return fail(err);
    }
  });

  ipcMain.handle(IPC.SETTINGS_GET, async () => loadSettings());

  ipcMain.handle(IPC.SETTINGS_SET, async (_e, s: AppSettings) => {
    try {
      await saveSettings(s);
      setAutoStart(s.autoStart);
      return ok();
    } catch (err) {
      return fail(err);
    }
  });

  ipcMain.handle(IPC.SESSION_STATUS, async () => getCurrentStatus());

  ipcMain.handle(IPC.SESSION_LOGIN, async () => {
    const win = getWindow();
    emitStatus(win, 'loading');
    try {
      await withPageLock(async () => {
        const creds = await getCredentials();
        if (!creds)
          throw new Error('Credenciais não configuradas. Abra Configurações.');
        const page = await client.getPage();
        await performLogin(page, creds);
        await client.persistSession(sessionPath());
      });
      emitStatus(win, 'connected');
      return ok();
    } catch (err) {
      logger.error('Login failed', err);
      emitStatus(win, 'error');
      return fail(err);
    }
  });

  ipcMain.handle(IPC.SESSION_LOGOUT, async () => {
    const win = getWindow();
    try {
      await withPageLock(async () => {
        const page = await client.getPage().catch(() => null);
        if (page) await doLogout(page);
        await clearSession();
        await client.close();
      });
      emitStatus(win, 'disconnected');
      return ok();
    } catch (err) {
      logger.error('Logout failed', err);
      return fail(err);
    }
  });

  ipcMain.handle(IPC.SESSION_VERIFY, async () => {
    const win = getWindow();
    emitStatus(win, 'loading');
    try {
      const isLogged = await withPageLock(async () => {
        const page = await client.getPage();
        return doVerifySession(page);
      });
      const next = isLogged ? 'connected' : 'expired';
      emitStatus(win, next);
      return ok(next);
    } catch (err) {
      logger.error('Verify session failed', err);
      emitStatus(win, 'error');
      return fail(err);
    }
  });

  ipcMain.handle(IPC.ACTION_AUTO_LANCAMENTO, async () => {
    const win = getWindow();
    try {
      await ensureSessionForAction(win);
      try {
        await withPageLock(async () => {
          const page = await client.getPage();
          await doAutoLancamento(page);
        });
      } catch (actionErr) {
        const msg = actionErr instanceof Error ? actionErr.message : String(actionErr);
        if (msg.includes('Sessão expirada') || msg.includes('Timeout')) {
          logger.warn('Auto lançamento: session stale, reconnecting and retrying');
          await forceReconnect(win);
          await withPageLock(async () => {
            const page = await client.getPage();
            await doAutoLancamento(page);
          });
        } else {
          throw actionErr;
        }
      }
      return ok();
    } catch (err) {
      logger.error('Auto lançamento failed', err);
      return fail(err);
    }
  });

  ipcMain.handle(IPC.ACTION_SELECT_MOOD, async (_e, mood: Mood) => {
    const win = getWindow();
    try {
      await ensureSessionForAction(win);
      try {
        await withPageLock(async () => {
          const page = await client.getPage();
          await doSelectMood(page, mood);
        });
      } catch (actionErr) {
        const msg = actionErr instanceof Error ? actionErr.message : String(actionErr);
        if (msg.includes('Sessão expirada')) {
          logger.warn('Select mood: session stale, reconnecting and retrying');
          await forceReconnect(win);
          await withPageLock(async () => {
            const page = await client.getPage();
            await doSelectMood(page, mood);
          });
        } else {
          throw actionErr;
        }
      }
      return ok();
    } catch (err) {
      logger.error('Select mood failed', err);
      return fail(err);
    }
  });

  ipcMain.handle(IPC.ACTION_OPEN_BEEFOR, async () => {
    try {
      await shell.openExternal(BEEFOR_LOGIN_URL);
      return ok();
    } catch (err) {
      return fail(err);
    }
  });

  ipcMain.handle(IPC.ACTION_LANCAR_HORA, async (_e, entry: TimesheetEntry) => {
    const win = getWindow();
    try {
      await ensureSessionForAction(win);
      await withPageLock(async () => {
        const page = await client.getPage();
        await doLancarHora(page, entry);
      });
      return ok();
    } catch (err) {
      logger.error('Lançar hora failed', err);
      return fail(err);
    }
  });

  ipcMain.handle(
    IPC.ACTION_FETCH_TIMESHEET,
    async (_e, year: number, month: number) => {
      const win = getWindow();
      try {
        await ensureSessionForAction(win);
        const rows = await withTimeout(
          withPageLock(async () => {
            const page = await client.getPage();
            return doFetchTimesheet(page, year, month);
          }),
          60_000,
          'Fetch timesheet',
        );
        return ok(rows);
      } catch (err) {
        logger.error('Fetch timesheet failed', err);
        return fail(err);
      }
    },
  );

  ipcMain.handle(IPC.ACTION_GET_CURRENT_MOOD, async () => {
    const win = getWindow();
    try {
      await ensureSessionForAction(win);
      try {
        const mood = await withPageLock(async () => {
          const page = await client.getPage();
          return doGetCurrentMood(page);
        });
        return ok(mood);
      } catch (actionErr) {
        const msg = actionErr instanceof Error ? actionErr.message : String(actionErr);
        if (msg.includes('Sessão expirada')) {
          logger.warn('Get current mood: session stale, reconnecting and retrying');
          await forceReconnect(win);
          const mood = await withPageLock(async () => {
            const page = await client.getPage();
            return doGetCurrentMood(page);
          });
          return ok(mood);
        }
        throw actionErr;
      }
    } catch (err) {
      logger.error('Get current mood failed', err);
      return fail(err);
    }
  });

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

  ipcMain.handle(
    IPC.NOTIFY_TEST,
    async (_e, kind: 'mood' | 'lunch' | 'kudocard' | 'punch') => {
      try {
        fireTestNotification(getWindow(), kind);
        return ok();
      } catch (err) {
        return fail(err);
      }
    },
  );

  ipcMain.handle(IPC.ACTION_GET_TODAY_ALERTS, async () => {
    try {
      const alerts = await getTodayAlerts();
      return ok(alerts);
    } catch (err) {
      return fail(err);
    }
  });
}

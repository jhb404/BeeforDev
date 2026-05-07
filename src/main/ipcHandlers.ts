import { BrowserWindow, app, ipcMain, shell } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { IPC } from '../shared/ipc';
import type {
  ActionResult,
  AppSettings,
  Credentials,
  Mood,
  SendKudoCardRequest,
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
  doSendKudoCard,
  doSearchKudoRecipient,
  doFetchKudoCounts,
  doFetchKudoLists,
  doFetchKudoDetail,
  doFetchTeamMembers,
} from '../automation/beefor/beeforActions';
import { withPageLock } from '../automation/beefor/pageLock';
import { ensureSessionForAction, forceReconnect } from './sessionGuard';
import { isElevated, relaunchAsAdmin } from './adminCheck';
import { fireTestNotification, getTodayAlerts } from './scheduler';
import { getBuildAssetPath, getBuildAssetsDir } from './window';
import {
  clearCoin2uCredentials,
  coin2uVerifyLogin,
  fetchCoin2uOrgs,
  getCoin2uDashboard,
  getCoin2uLog,
  getMaskedCoin2uCreds,
  onCoin2uLogin,
  saveCoin2uCredentials,
  transferCoin2uCoins,
} from './coin2uClient';
import type { Coin2uOrg } from '../shared/types';

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

  // Persist Coin2U session data (userId + Info + orgs) into settings on every
  // successful login. Avoids re-asking the user. Orgs are fetched best-effort.
  onCoin2uLogin(async ({ userId, info }) => {
    try {
      const settings = await loadSettings();
      const orgsRaw = await fetchCoin2uOrgs();
      const orgs = (Array.isArray(orgsRaw) ? orgsRaw : []) as Coin2uOrg[];
      const next: AppSettings = {
        ...settings,
        coin2uUserId: userId,
        coin2uInfo: info,
        coin2uOrgs: orgs,
      };
      await saveSettings(next);
      logger.info(`coin2u: settings updated (userId=${userId} orgs=${orgs.length})`);
    } catch (err) {
      logger.warn(
        `coin2u: persist settings failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  });

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

  ipcMain.handle(IPC.ACTION_KUDO_COUNTS, async () => {
    const win = getWindow();
    try {
      await ensureSessionForAction(win);
      const data = await withPageLock(async () => {
        const page = await client.getPage();
        return doFetchKudoCounts(page);
      });
      return ok(data);
    } catch (err) {
      logger.error('Kudo counts failed', err);
      return fail(err);
    }
  });

  ipcMain.handle(IPC.ACTION_KUDO_LISTS, async () => {
    const win = getWindow();
    try {
      await ensureSessionForAction(win);
      const data = await withPageLock(async () => {
        const page = await client.getPage();
        return doFetchKudoLists(page);
      });
      return ok(data);
    } catch (err) {
      logger.error('Kudo lists failed', err);
      return fail(err);
    }
  });

  ipcMain.handle(IPC.ACTION_KUDO_DETAIL, async (_e, id: string) => {
    const win = getWindow();
    if (!id || typeof id !== 'string') return fail(new Error('id inválido.'));
    try {
      await ensureSessionForAction(win);
      const data = await withPageLock(async () => {
        const page = await client.getPage();
        return doFetchKudoDetail(page, id);
      });
      return ok(data);
    } catch (err) {
      logger.error('Kudo detail failed', err);
      return fail(err);
    }
  });

  ipcMain.handle(
    IPC.ACTION_SEARCH_KUDO_RECIPIENT,
    async (_e, type: 'person' | 'team', query: string) => {
      const win = getWindow();
      if (type !== 'person' && type !== 'team') {
        return fail(new Error('Tipo inválido.'));
      }
      try {
        await ensureSessionForAction(win);
        const results = await withPageLock(async () => {
          const page = await client.getPage();
          return doSearchKudoRecipient(page, type, query ?? '');
        });
        return ok(results);
      } catch (err) {
        logger.warn(
          `Search kudo recipient failed: ${err instanceof Error ? err.message : String(err)}`,
        );
        return fail(err);
      }
    },
  );

  ipcMain.handle(
    IPC.ACTION_SEND_KUDO_CARD,
    async (_e, req: SendKudoCardRequest) => {
      const win = getWindow();
      if (!req || typeof req !== 'object') return fail(new Error('Payload inválido.'));
      if (!req.recipientName?.trim()) return fail(new Error('Informe o destinatário.'));
      if (!req.message?.trim()) return fail(new Error('Mensagem não pode ser vazia.'));
      if (req.recipientType !== 'person' && req.recipientType !== 'team') {
        return fail(new Error('Tipo de destinatário inválido.'));
      }
      try {
        await ensureSessionForAction(win);
        try {
          const result = await withPageLock(async () => {
            const page = await client.getPage();
            return doSendKudoCard(page, req);
          });
          return ok(result);
        } catch (actionErr) {
          const msg = actionErr instanceof Error ? actionErr.message : String(actionErr);
          if (/Sess|expirou|expirada/i.test(msg)) {
            logger.warn('KudoCard: session stale, reconnecting and retrying');
            await forceReconnect(win);
            const result = await withPageLock(async () => {
              const page = await client.getPage();
              return doSendKudoCard(page, req);
            });
            return ok(result);
          }
          throw actionErr;
        }
      } catch (err) {
        logger.error('Send KudoCard failed', err);
        return fail(err);
      }
    },
  );

  ipcMain.handle(IPC.ACTION_FETCH_TEAM_MEMBERS, async () => {
    const win = getWindow();
    try {
      await ensureSessionForAction(win);
      const data = await withTimeout(
        withPageLock(async () => {
          const page = await client.getPage();
          return doFetchTeamMembers(page);
        }),
        45_000,
        'Fetch team',
      );
      return ok(data);
    } catch (err) {
      logger.error('Fetch team members failed', err);
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

  ipcMain.on(IPC.WIN_MINIMIZE, () => getWindow()?.minimize());
  ipcMain.on(IPC.WIN_MAXIMIZE, () => {
    const win = getWindow();
    if (!win) return;
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });
  ipcMain.on(IPC.WIN_CLOSE, () => getWindow()?.hide());

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
      logger.warn(`readAsset failed for ${safe}: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  });

  // === Coin2U ===
  ipcMain.handle(IPC.COIN2U_SAVE_CREDS, async (_e, payload: { email: string; password: string; userId?: number }) => {
    try {
      await saveCoin2uCredentials({ email: payload.email, password: payload.password });
      // userId now auto-captured on login; keep optional manual override for back-compat
      const settings = await loadSettings();
      const next: AppSettings = { ...settings, coin2uUserId: payload.userId };
      await saveSettings(next);
      return ok();
    } catch (err) {
      return fail(err);
    }
  });

  ipcMain.handle(IPC.COIN2U_GET_CREDS, async () => {
    const settings = await loadSettings();
    const masked = await getMaskedCoin2uCreds(settings.coin2uUserId);
    if (!masked) return null;
    return { ...masked, connected: !!settings.coin2uUserId };
  });

  ipcMain.handle(IPC.COIN2U_CLEAR_CREDS, async () => {
    try {
      await clearCoin2uCredentials();
      const settings = await loadSettings();
      const next: AppSettings = { ...settings, coin2uUserId: undefined };
      await saveSettings(next);
      return ok();
    } catch (err) {
      return fail(err);
    }
  });

  ipcMain.handle(IPC.COIN2U_GET_DASHBOARD, async () => {
    try {
      const settings = await loadSettings();
      const data = await getCoin2uDashboard(settings.coin2uUserId);
      return ok(data);
    } catch (err) {
      return fail(err);
    }
  });

  ipcMain.handle(IPC.COIN2U_GET_LOG, async () => {
    try {
      const settings = await loadSettings();
      const data = await getCoin2uLog(settings.coin2uUserId);
      return ok(data);
    } catch (err) {
      return fail(err);
    }
  });

  ipcMain.handle(IPC.COIN2U_TRANSFER, async (_e, payload: { To: number; Amount: number; Message: string }) => {
    try {
      const settings = await loadSettings();
      const data = await transferCoin2uCoins(payload, settings.coin2uUserId);
      return ok(data);
    } catch (err) {
      return fail(err);
    }
  });

  ipcMain.handle(IPC.COIN2U_VERIFY, async () => {
    try {
      const info = await coin2uVerifyLogin();
      // Persist captured userId so other flows (and UI) see it
      const settings = await loadSettings();
      if (settings.coin2uUserId !== info.userId) {
        await saveSettings({ ...settings, coin2uUserId: info.userId });
      }
      return ok(info);
    } catch (err) {
      return fail(err);
    }
  });
}

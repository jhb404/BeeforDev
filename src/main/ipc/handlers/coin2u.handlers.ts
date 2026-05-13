import { ipcMain } from 'electron';
import { IPC } from '../../../shared/ipc';
import type { AppSettings, Coin2uOrg } from '../../../shared/types';
import { loadSettings, saveSettings } from '../../sessionStore';
import { logger } from '../../logger';
import { ok, fail } from '../../services/result';
import {
  buyCoin2uItem,
  clearCoin2uCredentials,
  coin2uVerifyLogin,
  fetchCoin2uOrgs,
  getCoin2uDashboard,
  getCoin2uLog,
  getCoin2uShop,
  getMaskedCoin2uCreds,
  onCoin2uLogin,
  saveCoin2uCredentials,
  transferCoin2uCoins,
} from '../../coin2uClient';

export function registerCoin2uHandlers() {
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

  ipcMain.handle(
    IPC.COIN2U_SAVE_CREDS,
    async (_e, payload: { email: string; password: string; userId?: number }) => {
      try {
        await saveCoin2uCredentials({
          email: payload.email,
          password: payload.password,
        });
        // userId now auto-captured on login; keep optional manual override for back-compat
        const settings = await loadSettings();
        const next: AppSettings = {
          ...settings,
          coin2uUserId: payload.userId,
        };
        await saveSettings(next);
        return ok();
      } catch (err) {
        return fail(err);
      }
    },
  );

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

  ipcMain.handle(IPC.COIN2U_GET_SHOP, async () => {
    try {
      const settings = await loadSettings();
      const data = await getCoin2uShop(settings.coin2uUserId, settings.coin2uInfo);
      return ok(data);
    } catch (err) {
      return fail(err);
    }
  });

  ipcMain.handle(
    IPC.COIN2U_BUY_ITEM,
    async (_e, payload: { shopItemId: number; price: number }) => {
      try {
        const settings = await loadSettings();
        const data = await buyCoin2uItem(payload, settings.coin2uUserId);
        return ok(data);
      } catch (err) {
        return fail(err);
      }
    },
  );

  ipcMain.handle(
    IPC.COIN2U_TRANSFER,
    async (_e, payload: { To: number; Amount: number; Message: string }) => {
      try {
        const settings = await loadSettings();
        const data = await transferCoin2uCoins(payload, settings.coin2uUserId);
        return ok(data);
      } catch (err) {
        return fail(err);
      }
    },
  );

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

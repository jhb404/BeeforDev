import { IPC } from '../../../shared/ipc/index';
import type { AppSettings, Coin2uOrg } from '../../../shared/types/index';
import { loadSettings, saveSettings } from '../../sessionStore';
import { logger } from '../../logger';
import { ok } from '../../../shared/result';
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
} from '../../coin2u';
import { coin2uBuyItemSchema, coin2uCredentialsSchema, coin2uTransferSchema } from '../schemas';
import { defineHandler } from '../defineHandler';

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

  defineHandler({
    channel: IPC.COIN2U_SAVE_CREDS,
    schema: coin2uCredentialsSchema,
    errorMessage: 'Coin2U save credentials failed',
    run: async ({ data }) => {
      await saveCoin2uCredentials({
        email: data.email,
        password: data.password,
      });
      const settings = await loadSettings();
      const next: AppSettings = { ...settings, coin2uUserId: undefined };
      await saveSettings(next);
      return ok();
    },
  });

  defineHandler({
    channel: IPC.COIN2U_GET_CREDS,
    errorMessage: 'Coin2U get credentials failed',
    run: async () => {
      const settings = await loadSettings();
      const masked = await getMaskedCoin2uCreds(settings.coin2uUserId);
      if (!masked) return null;
      return { ...masked, connected: !!settings.coin2uUserId };
    },
  });

  defineHandler({
    channel: IPC.COIN2U_CLEAR_CREDS,
    errorMessage: 'Coin2U clear credentials failed',
    run: async () => {
      await clearCoin2uCredentials();
      const settings = await loadSettings();
      const next: AppSettings = { ...settings, coin2uUserId: undefined };
      await saveSettings(next);
      return ok();
    },
  });

  defineHandler({
    channel: IPC.COIN2U_GET_DASHBOARD,
    errorMessage: 'Coin2U get dashboard failed',
    run: async () => {
      const settings = await loadSettings();
      const data = await getCoin2uDashboard(settings.coin2uUserId);
      return ok(data);
    },
  });

  defineHandler({
    channel: IPC.COIN2U_GET_LOG,
    errorMessage: 'Coin2U get log failed',
    run: async () => {
      const settings = await loadSettings();
      const data = await getCoin2uLog(settings.coin2uUserId);
      return ok(data);
    },
  });

  defineHandler({
    channel: IPC.COIN2U_GET_SHOP,
    errorMessage: 'Coin2U get shop failed',
    run: async () => {
      const settings = await loadSettings();
      const data = await getCoin2uShop(settings.coin2uUserId, settings.coin2uInfo);
      return ok(data);
    },
  });

  defineHandler({
    channel: IPC.COIN2U_BUY_ITEM,
    schema: coin2uBuyItemSchema,
    errorMessage: 'Coin2U buy item failed',
    run: async ({ data }) => {
      const settings = await loadSettings();
      const result = await buyCoin2uItem(data, settings.coin2uUserId);
      return ok(result);
    },
  });

  defineHandler({
    channel: IPC.COIN2U_TRANSFER,
    schema: coin2uTransferSchema,
    errorMessage: 'Coin2U transfer failed',
    run: async ({ data }) => {
      const settings = await loadSettings();
      const result = await transferCoin2uCoins(data, settings.coin2uUserId);
      return ok(result);
    },
  });

  defineHandler({
    channel: IPC.COIN2U_VERIFY,
    errorMessage: 'Coin2U verify failed',
    run: async () => {
      const info = await coin2uVerifyLogin();
      // Persist captured userId so other flows (and UI) see it
      const settings = await loadSettings();
      if (settings.coin2uUserId !== info.userId) {
        await saveSettings({ ...settings, coin2uUserId: info.userId });
      }
      return ok(info);
    },
  });
}

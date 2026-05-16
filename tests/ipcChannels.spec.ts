import { describe, it, expect } from 'vitest';
import { IPC } from '../src/shared/ipc/index';

const EXPECTED_IPC = {
  CREDS_SAVE: 'creds:save',
  CREDS_GET: 'creds:get',
  CREDS_CLEAR: 'creds:clear',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SESSION_STATUS: 'session:status',
  SESSION_LOGIN: 'session:login',
  SESSION_LOGOUT: 'session:logout',
  SESSION_VERIFY: 'session:verify',
  ACTION_AUTO_LANCAMENTO: 'action:autoLancamento',
  ACTION_SELECT_MOOD: 'action:selectMood',
  ACTION_OPEN_BEEFOR: 'action:openBeefor',
  ACTION_LANCAR_HORA: 'action:lancarHora',
  ACTION_FETCH_TIMESHEET: 'action:fetchTimesheet',
  ACTION_GET_CURRENT_MOOD: 'action:getCurrentMood',
  ACTION_SEND_KUDO_CARD: 'action:sendKudoCard',
  ACTION_SEARCH_KUDO_RECIPIENT: 'action:searchKudoRecipient',
  ACTION_KUDO_COUNTS: 'action:kudoCounts',
  ACTION_KUDO_LISTS: 'action:kudoLists',
  ACTION_KUDO_DETAIL: 'action:kudoDetail',
  ACTION_FETCH_TEAM_MEMBERS: 'action:fetchTeamMembers',
  ADMIN_STATUS: 'admin:status',
  ADMIN_RELAUNCH: 'admin:relaunch',
  APP_RELAUNCH: 'app:relaunch',
  NOTIFY_TEST: 'notify:test',
  ACTION_GET_TODAY_ALERTS: 'action:getTodayAlerts',
  ACTION_SNOOZE_ALERT: 'action:snoozeAlert',
  COIN2U_SAVE_CREDS: 'coin2u:saveCreds',
  COIN2U_GET_CREDS: 'coin2u:getCreds',
  COIN2U_CLEAR_CREDS: 'coin2u:clearCreds',
  COIN2U_GET_DASHBOARD: 'coin2u:getDashboard',
  COIN2U_GET_LOG: 'coin2u:getLog',
  COIN2U_GET_SHOP: 'coin2u:getShop',
  COIN2U_BUY_ITEM: 'coin2u:buyItem',
  COIN2U_TRANSFER: 'coin2u:transfer',
  COIN2U_VERIFY: 'coin2u:verify',
  WIN_MINIMIZE: 'win:minimize',
  WIN_MAXIMIZE: 'win:maximize',
  WIN_CLOSE: 'win:close',
  APP_GET_ASSET_PATH: 'app:getAssetPath',
  APP_READ_ASSET: 'app:readAsset',
  EVT_STATUS: 'evt:status',
  EVT_PLAY_ALARM: 'evt:playAlarm',
  EVT_NOTIFY: 'evt:notify',
  EVT_UPDATE_AVAILABLE: 'evt:updateAvailable',
  EVT_UPDATE_DOWNLOADED: 'evt:updateDownloaded',
  EVT_TRAY_LUNCH_TIMER: 'evt:trayLunchTimer',
  EVT_TRAY_OPEN_KUDO: 'evt:trayOpenKudo',
  EVT_TRAY_OPEN_COINS: 'evt:trayOpenCoins',
  TRAY_SET_LUNCH_ACTIVE: 'tray:setLunchActive',
  WIN_SET_ICON: 'win:setIcon',
  UPDATER_QUIT_AND_INSTALL: 'updater:quitAndInstall',
  ACTION_FETCH_ATIVIDADES: 'action:fetchAtividades',
  ACTION_NOTIFY: 'action:notify',
} as const satisfies typeof IPC;

describe('IPC channels', () => {
  it('matches the complete channel contract', () => {
    expect(IPC).toEqual(EXPECTED_IPC);
  });

  it('all channels are unique', () => {
    const values = Object.values(IPC);
    expect(new Set(values).size).toBe(values.length);
  });

  it('has core session/action channels', () => {
    expect(IPC.SESSION_LOGIN).toBeDefined();
    expect(IPC.ACTION_AUTO_LANCAMENTO).toBeDefined();
    expect(IPC.ACTION_SELECT_MOOD).toBeDefined();
  });
});

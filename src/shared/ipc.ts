export const IPC = {
  // credentials
  CREDS_SAVE: 'creds:save',
  CREDS_GET: 'creds:get',
  CREDS_CLEAR: 'creds:clear',

  // settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // session / actions
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

  // admin / system
  ADMIN_STATUS: 'admin:status',
  ADMIN_RELAUNCH: 'admin:relaunch',
  APP_RELAUNCH: 'app:relaunch',

  // notification testing
  NOTIFY_TEST: 'notify:test',

  // today alerts
  ACTION_GET_TODAY_ALERTS: 'action:getTodayAlerts',

  // snooze
  ACTION_SNOOZE_ALERT: 'action:snoozeAlert',

  // coin2u
  COIN2U_SAVE_CREDS: 'coin2u:saveCreds',
  COIN2U_GET_CREDS: 'coin2u:getCreds',
  COIN2U_CLEAR_CREDS: 'coin2u:clearCreds',
  COIN2U_GET_DASHBOARD: 'coin2u:getDashboard',
  COIN2U_VERIFY: 'coin2u:verify',

  // window controls (frameless)
  WIN_MINIMIZE: 'win:minimize',
  WIN_MAXIMIZE: 'win:maximize',
  WIN_CLOSE: 'win:close',

  // app info
  APP_GET_ASSET_PATH: 'app:getAssetPath',
  APP_READ_ASSET: 'app:readAsset',

  // events main → renderer
  EVT_STATUS: 'evt:status',
  EVT_PLAY_ALARM: 'evt:playAlarm',
  EVT_NOTIFY: 'evt:notify',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

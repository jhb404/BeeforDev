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

  // events main → renderer
  EVT_STATUS: 'evt:status',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

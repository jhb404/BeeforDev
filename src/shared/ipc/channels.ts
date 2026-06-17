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
  COIN2U_GET_LOG: 'coin2u:getLog',
  COIN2U_GET_SHOP: 'coin2u:getShop',
  COIN2U_BUY_ITEM: 'coin2u:buyItem',
  COIN2U_TRANSFER: 'coin2u:transfer',
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
  EVT_UPDATE_AVAILABLE: 'evt:updateAvailable',
  EVT_UPDATE_DOWNLOADED: 'evt:updateDownloaded',
  EVT_TRAY_LUNCH_TIMER: 'evt:trayLunchTimer',
  EVT_TRAY_OPEN_KUDO: 'evt:trayOpenKudo',
  EVT_TRAY_OPEN_COINS: 'evt:trayOpenCoins',
  TRAY_SET_LUNCH_ACTIVE: 'tray:setLunchActive',
  WIN_SET_ICON: 'win:setIcon',

  // updater
  UPDATER_QUIT_AND_INSTALL: 'updater:quitAndInstall',

  // atividades
  ACTION_FETCH_ATIVIDADES: 'action:fetchAtividades',

  // notificação customizada do renderer → main
  ACTION_NOTIFY: 'action:notify',

  // HTTP API (env-aware, sem Playwright) — Fase 1/2/3
  API_LOGIN: 'api:login',
  API_LOGOUT: 'api:logout',
  API_SESSION_INFO: 'api:sessionInfo',
  API_MOOD_GET: 'api:moodGet',
  API_MOOD_ADD: 'api:moodAdd',
  API_MOOD_EDIT: 'api:moodEdit',
  API_MOOD_STREAK_ORG: 'api:moodStreakOrg',
  API_KUDO_SEND: 'api:kudoSend',
  API_KUDO_COUNTS: 'api:kudoCounts',
  API_KUDO_LISTS: 'api:kudoLists',
  API_KUDO_DETAIL: 'api:kudoDetail',
  API_KUDO_RECIPIENTS: 'api:kudoRecipients',
  API_PESSOA_SEARCH: 'api:pessoaSearch',
  API_TIME_SEARCH: 'api:timeSearch',
  API_ORG_LIST: 'api:orgList',
  API_ORG_SELECT: 'api:orgSelect',
  API_TS_MONTH: 'api:tsMonth',
  API_TS_POST: 'api:tsPost',
  API_TS_AUTO: 'api:tsAuto',
  API_TS_TOTAIS: 'api:tsTotais',
  API_ATIV_MINHAS: 'api:atividadesMinhas',
  API_ATIV_DETAIL: 'api:atividadesDetail',
  API_ATIV_EDIT: 'api:atividadesEdit',
  API_ATIV_COMMENTS: 'api:atividadesComments',
  API_ATIV_ADD_COMMENT: 'api:atividadesAddComment',
  API_ENV_GET: 'api:envGet',
  API_ENV_SET: 'api:envSet',
  API_NOTIF_UNREAD: 'api:notifUnread',
  API_NOTIF_ALL: 'api:notifAll',
  API_NOTIF_READ: 'api:notifRead',
  API_NOTIF_READ_ALL: 'api:notifReadAll',
  API_NOTIF_NOVIDADES: 'api:notifNovidades',
  API_NOTIF_NOVIDADES_USER: 'api:notifNovidadesUser',
  API_NOTIF_NOVIDADES_TOTAL: 'api:notifNovidadesTotal',
  API_NOTIF_NOVIDADE_READ: 'api:notifNovidadeRead',
  API_NOTIF_NOVIDADES_READ_ALL: 'api:notifNovidadesReadAll',
  API_HUB_CONNECT: 'api:hubConnect',
  API_HUB_DISCONNECT: 'api:hubDisconnect',
  EVT_HUB: 'evt:hub',
  API_ATIV_RESUMO: 'api:atividadesResumo',
  API_ATIV_RESPONSAVEIS: 'api:atividadesResponsaveis',
  API_ATIV_PROJETOS: 'api:atividadesProjetos',
  API_ATIV_ITERACOES: 'api:atividadesIteracoes',
  API_ATIV_ETIQUETAS: 'api:atividadesEtiquetas',
  API_ATIV_COLUNAS: 'api:atividadesColunas',
  API_ATIV_ARQUIVAR: 'api:atividadesArquivar',
  API_ATIV_LOGS: 'api:atividadesLogs',
  API_ATIV_ANEXOS: 'api:atividadesAnexos',
  API_ATIV_ANEXO_ADD: 'api:atividadesAnexoAdd',
  API_ATIV_ANEXO_DEL: 'api:atividadesAnexoDel',
  API_PERFIL_GET: 'api:perfilGet',
  API_PERFIL_HABILIDADES: 'api:perfilHabilidades',
  API_PERFIL_HABILIDADES_COMBO: 'api:perfilHabilidadesCombo',
  API_PERFIL_ADD_HABILIDADE: 'api:perfilAddHabilidade',
  API_PERFIL_MOTIVADORES: 'api:perfilMotivadores',
  API_PERFIL_MOTIVADORES_ADD: 'api:perfilMotivadoresAdd',
  API_PERFIL_MOTIVADORES_EDIT: 'api:perfilMotivadoresEdit',
  API_PERFIL_ACOES: 'api:perfilAcoes',
  API_PERFIL_MAPPING: 'api:perfilMapping',
  API_PERFIL_MAPPING_ADD: 'api:perfilMappingAdd',
  API_PERFIL_MAPPING_EDIT: 'api:perfilMappingEdit',
  API_PERFIL_MAPPING_DEL: 'api:perfilMappingDel',
  API_PERFIL_REMOVE_HABILIDADE: 'api:perfilRemoveHabilidade',
  API_PERFIL_EDIT_GET: 'api:perfilEditGet',
  API_PERFIL_EDIT_SAVE: 'api:perfilEditSave',
  API_PERFIL_GESTORES: 'api:perfilGestores',

  // planning poker (servidor WS local no main)
  POKER_GET_PORT: 'poker:getPort',
  POKER_GET_LOCAL_IP: 'poker:getLocalIp',
  POKER_START_TUNNEL: 'poker:startTunnel',
  POKER_STOP_TUNNEL: 'poker:stopTunnel',

  // clipboard nativo (navigator.clipboard falha em file://)
  CLIPBOARD_WRITE: 'clipboard:write',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

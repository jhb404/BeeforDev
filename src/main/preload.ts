import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc/index';
import type {
  ActionResult,
  AppSettings,
  BeeforAtividade,
  Coin2uBuyItemRequest,
  Coin2uCredentials,
  Coin2uDashboard,
  Coin2uLog,
  Coin2uShop,
  Coin2uTransferRequest,
  Credentials,
  FetchedTimesheetRow,
  KudoCardCounts,
  KudoCardDetail,
  KudoCardLists,
  KudoCardRecipientType,
  KudoSearchResult,
  Mood,
  SendKudoCardRequest,
  SendKudoCardResult,
  SessionStatus,
  TeamMember,
  TimesheetEntry,
  TodayAlert,
} from '../shared/types/index';

type AlarmInfo = { title: string; body: string; kind?: Exclude<TodayAlert['kind'], 'birthday'> };

const api = {
  saveCredentials: (creds: Credentials): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.CREDS_SAVE, creds),
  getCredentials: (): Promise<{ email: string } | null> => ipcRenderer.invoke(IPC.CREDS_GET),
  clearCredentials: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.CREDS_CLEAR),

  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.SETTINGS_GET),
  setSettings: (s: AppSettings): Promise<ActionResult> => ipcRenderer.invoke(IPC.SETTINGS_SET, s),

  getStatus: (): Promise<SessionStatus> => ipcRenderer.invoke(IPC.SESSION_STATUS),
  login: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.SESSION_LOGIN),
  logout: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.SESSION_LOGOUT),
  verifySession: (): Promise<ActionResult<SessionStatus>> => ipcRenderer.invoke(IPC.SESSION_VERIFY),

  autoLancamento: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.ACTION_AUTO_LANCAMENTO),
  selectMood: (mood: Mood): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.ACTION_SELECT_MOOD, mood),
  openBeefor: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.ACTION_OPEN_BEEFOR),
  lancarHora: (entry: TimesheetEntry): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.ACTION_LANCAR_HORA, entry),
  fetchTimesheet: (year: number, month: number): Promise<ActionResult<FetchedTimesheetRow[]>> =>
    ipcRenderer.invoke(IPC.ACTION_FETCH_TIMESHEET, year, month),
  getCurrentMood: (): Promise<ActionResult<string | null>> =>
    ipcRenderer.invoke(IPC.ACTION_GET_CURRENT_MOOD),
  sendKudoCard: (req: SendKudoCardRequest): Promise<ActionResult<SendKudoCardResult>> =>
    ipcRenderer.invoke(IPC.ACTION_SEND_KUDO_CARD, req),
  searchKudoRecipient: (
    type: KudoCardRecipientType,
    query: string,
  ): Promise<ActionResult<KudoSearchResult[]>> =>
    ipcRenderer.invoke(IPC.ACTION_SEARCH_KUDO_RECIPIENT, type, query),
  getKudoCounts: (): Promise<ActionResult<KudoCardCounts>> =>
    ipcRenderer.invoke(IPC.ACTION_KUDO_COUNTS),
  getKudoLists: (): Promise<ActionResult<KudoCardLists>> =>
    ipcRenderer.invoke(IPC.ACTION_KUDO_LISTS),
  getKudoDetail: (id: string): Promise<ActionResult<KudoCardDetail>> =>
    ipcRenderer.invoke(IPC.ACTION_KUDO_DETAIL, id),

  fetchTeamMembers: (): Promise<ActionResult<TeamMember[]>> =>
    ipcRenderer.invoke(IPC.ACTION_FETCH_TEAM_MEMBERS),

  onStatus: (cb: (status: SessionStatus) => void): (() => void) => {
    const listener = (_e: unknown, status: SessionStatus) => cb(status);
    ipcRenderer.on(IPC.EVT_STATUS, listener);
    return () => {
      ipcRenderer.removeListener(IPC.EVT_STATUS, listener);
    };
  },

  // admin / system
  getAdminStatus: (): Promise<{ elevated: boolean; platform: string }> =>
    ipcRenderer.invoke(IPC.ADMIN_STATUS),
  relaunchAsAdmin: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.ADMIN_RELAUNCH),
  relaunchApp: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.APP_RELAUNCH),

  // notification testing
  testNotification: (kind: 'mood' | 'lunch' | 'kudocard' | 'punch' | 'pj'): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.NOTIFY_TEST, kind),

  getTodayAlerts: (): Promise<ActionResult<TodayAlert[]>> =>
    ipcRenderer.invoke(IPC.ACTION_GET_TODAY_ALERTS),

  onPlayAlarm: (cb: (info: AlarmInfo) => void): (() => void) => {
    const listener = (_e: unknown, info: AlarmInfo) => cb(info);
    ipcRenderer.on(IPC.EVT_PLAY_ALARM, listener);
    return () => ipcRenderer.removeListener(IPC.EVT_PLAY_ALARM, listener);
  },
  onNotify: (cb: (info: { title: string; body: string }) => void): (() => void) => {
    const listener = (_e: unknown, info: { title: string; body: string }) => cb(info);
    ipcRenderer.on(IPC.EVT_NOTIFY, listener);
    return () => ipcRenderer.removeListener(IPC.EVT_NOTIFY, listener);
  },

  setLunchTimerActive: (active: boolean): void =>
    ipcRenderer.send(IPC.TRAY_SET_LUNCH_ACTIVE, active),

  // Tray → renderer events
  onTrayLunchTimer: (cb: () => void): (() => void) => {
    const listener = () => cb();
    ipcRenderer.on(IPC.EVT_TRAY_LUNCH_TIMER, listener);
    return () => ipcRenderer.removeListener(IPC.EVT_TRAY_LUNCH_TIMER, listener);
  },
  onTrayOpenKudo: (cb: () => void): (() => void) => {
    const listener = () => cb();
    ipcRenderer.on(IPC.EVT_TRAY_OPEN_KUDO, listener);
    return () => ipcRenderer.removeListener(IPC.EVT_TRAY_OPEN_KUDO, listener);
  },
  onTrayOpenCoins: (cb: () => void): (() => void) => {
    const listener = () => cb();
    ipcRenderer.on(IPC.EVT_TRAY_OPEN_COINS, listener);
    return () => ipcRenderer.removeListener(IPC.EVT_TRAY_OPEN_COINS, listener);
  },

  // Updater events
  onUpdateAvailable: (cb: (info: { version: string }) => void): (() => void) => {
    const listener = (_e: unknown, info: { version: string }) => cb(info);
    ipcRenderer.on(IPC.EVT_UPDATE_AVAILABLE, listener);
    return () => ipcRenderer.removeListener(IPC.EVT_UPDATE_AVAILABLE, listener);
  },
  onUpdateDownloaded: (cb: (info: { version: string }) => void): (() => void) => {
    const listener = (_e: unknown, info: { version: string }) => cb(info);
    ipcRenderer.on(IPC.EVT_UPDATE_DOWNLOADED, listener);
    return () => ipcRenderer.removeListener(IPC.EVT_UPDATE_DOWNLOADED, listener);
  },
  quitAndInstallUpdate: (): Promise<void> => ipcRenderer.invoke(IPC.UPDATER_QUIT_AND_INSTALL),

  // Window controls (frameless)
  winMinimize: () => ipcRenderer.send(IPC.WIN_MINIMIZE),
  winMaximize: () => ipcRenderer.send(IPC.WIN_MAXIMIZE),
  winClose: () => ipcRenderer.send(IPC.WIN_CLOSE),
  winSetIcon: (dataUrl: string) => ipcRenderer.send(IPC.WIN_SET_ICON, dataUrl),

  // App info
  getAssetPath: (): Promise<string> => ipcRenderer.invoke(IPC.APP_GET_ASSET_PATH),
  readAsset: (fileName: string): Promise<string | null> =>
    ipcRenderer.invoke(IPC.APP_READ_ASSET, fileName),

  // atividades
  fetchAtividades: (): Promise<ActionResult<BeeforAtividade[]>> =>
    ipcRenderer.invoke(IPC.ACTION_FETCH_ATIVIDADES),

  // notificação customizada renderer → main
  notifyWindows: (
    title: string,
    body: string,
    variant?: 'orange' | 'purple',
  ): Promise<ActionResult> => ipcRenderer.invoke(IPC.ACTION_NOTIFY, title, body, variant),

  // Coin2U
  saveCoin2uCreds: (payload: { email: string; password: string }): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.COIN2U_SAVE_CREDS, payload),
  getCoin2uCreds: (): Promise<Coin2uCredentials | null> => ipcRenderer.invoke(IPC.COIN2U_GET_CREDS),
  clearCoin2uCreds: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.COIN2U_CLEAR_CREDS),
  getCoin2uDashboard: (): Promise<ActionResult<Coin2uDashboard>> =>
    ipcRenderer.invoke(IPC.COIN2U_GET_DASHBOARD),
  getCoin2uLog: (): Promise<ActionResult<Coin2uLog>> => ipcRenderer.invoke(IPC.COIN2U_GET_LOG),
  getCoin2uShop: (): Promise<ActionResult<Coin2uShop>> => ipcRenderer.invoke(IPC.COIN2U_GET_SHOP),
  buyCoin2uItem: (payload: Coin2uBuyItemRequest): Promise<ActionResult<boolean>> =>
    ipcRenderer.invoke(IPC.COIN2U_BUY_ITEM, payload),
  transferCoin2uCoins: (payload: Coin2uTransferRequest): Promise<ActionResult<boolean>> =>
    ipcRenderer.invoke(IPC.COIN2U_TRANSFER, payload),
  verifyCoin2u: (): Promise<ActionResult<{ userId: number; email: string }>> =>
    ipcRenderer.invoke(IPC.COIN2U_VERIFY),

  // Planning Poker
  pokerGetPort: (): Promise<number> => ipcRenderer.invoke(IPC.POKER_GET_PORT),
  pokerGetLocalIp: (): Promise<string> => ipcRenderer.invoke(IPC.POKER_GET_LOCAL_IP),
  pokerStartTunnel: (): Promise<ActionResult<string>> => ipcRenderer.invoke(IPC.POKER_START_TUNNEL),
  pokerStopTunnel: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.POKER_STOP_TUNNEL),

  clipboardWrite: (text: string): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.CLIPBOARD_WRITE, text),

  // Deep link beefor:// (convite de sala)
  consumeDeepLink: (): Promise<string | null> => ipcRenderer.invoke(IPC.DEEPLINK_CONSUME),
  onDeepLink: (cb: (url: string) => void): (() => void) => {
    const listener = (_e: unknown, url: string) => cb(url);
    ipcRenderer.on(IPC.EVT_DEEPLINK_URL, listener);
    return () => ipcRenderer.removeListener(IPC.EVT_DEEPLINK_URL, listener);
  },
};

const httpApi = {
  // Auth
  login: (usuario: string, senha: string): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.API_LOGIN, { usuario, senha }),
  logout: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_LOGOUT),
  sessionInfo: (): Promise<
    ActionResult<{
      idPessoa: string;
      idOrganizacao: string | null;
      nome?: string;
      email?: string;
    } | null>
  > => ipcRenderer.invoke(IPC.API_SESSION_INFO),

  // Env
  getEnv: (): Promise<ActionResult<'local' | 'prod'>> => ipcRenderer.invoke(IPC.API_ENV_GET),
  setEnv: (env: 'local' | 'prod'): Promise<ActionResult<{ env: 'local' | 'prod' }>> =>
    ipcRenderer.invoke(IPC.API_ENV_SET, env),

  // Mood
  mood: {
    get: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_MOOD_GET),
    add: (mood: Mood): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_MOOD_ADD, mood),
    edit: (idSentimentoPessoa: string, mood: Mood): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_MOOD_EDIT, { idSentimentoPessoa, mood }),
    streakOrg: (dataInicio?: string, dataFim?: string, topN: number = 30): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_MOOD_STREAK_ORG, { dataInicio, dataFim, topN }),
  },

  // KudoCard
  kudo: {
    send: (req: {
      idDestinatario: string;
      tipoDestinatario: 1 | 2;
      cardType: string;
      mensagem: string;
      idTime?: string;
    }): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_KUDO_SEND, req),
    counts: (): Promise<ActionResult<KudoCardCounts>> => ipcRenderer.invoke(IPC.API_KUDO_COUNTS),
    lists: (): Promise<ActionResult<KudoCardLists>> => ipcRenderer.invoke(IPC.API_KUDO_LISTS),
    detail: (id: string): Promise<ActionResult<KudoCardDetail>> =>
      ipcRenderer.invoke(IPC.API_KUDO_DETAIL, id),
    recipients: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_KUDO_RECIPIENTS),
  },

  // Pessoa / Organizacao
  pessoa: {
    search: (query: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_PESSOA_SEARCH, query),
    searchTimes: (query: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_TIME_SEARCH, query),
  },
  org: {
    list: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_ORG_LIST),
    select: (idOrganizacao: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_ORG_SELECT, idOrganizacao),
    /** Troca de organização: pega token novo escopado + invalida caches. UI deve recarregar. */
    switch: (
      idOrganizacao: string,
    ): Promise<
      ActionResult<{
        idOrganizacao: string | null;
        idPessoa: string;
        nome?: string;
        nomeOrganizacao?: string;
      }>
    > => ipcRenderer.invoke(IPC.API_ORG_SWITCH, idOrganizacao),
  },
  team: {
    list: (): Promise<
      ActionResult<
        Array<{ id: string; nome: string; favorito: boolean; idGrupo?: string; logo?: string }>
      >
    > => ipcRenderer.invoke(IPC.API_TIME_LIST),
    favorite: (idTime: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_TIME_FAVORITE, idTime),
    unfavorite: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_TIME_UNFAVORITE),
    groups: (): Promise<ActionResult<Array<{ idGrupo: string; nome: string }>>> =>
      ipcRenderer.invoke(IPC.API_GRUPO_LIST),
  },

  // Timesheet
  timesheet: {
    month: (year: number, month: number): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_TS_MONTH, year, month),
    post: (dia: unknown): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_TS_POST, dia),
    auto: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_TS_AUTO),
    totais: (year: number, month: number): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_TS_TOTAIS, year, month),
  },

  // SignalR Hub
  hub: {
    connect: (): Promise<ActionResult<{ connected: boolean }>> =>
      ipcRenderer.invoke(IPC.API_HUB_CONNECT),
    disconnect: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_HUB_DISCONNECT),
    onEvent: (cb: (e: { type: string; payload: unknown }) => void): (() => void) => {
      const listener = (_e: unknown, msg: { type: string; payload: unknown }) => cb(msg);
      ipcRenderer.on(IPC.EVT_HUB, listener);
      return () => ipcRenderer.removeListener(IPC.EVT_HUB, listener);
    },
  },

  // Perfil
  perfil: {
    get: (idPessoa?: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_PERFIL_GET, idPessoa),
    habilidades: (idPessoa?: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_PERFIL_HABILIDADES, idPessoa),
    habilidadesCombo: (idPessoa?: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_PERFIL_HABILIDADES_COMBO, idPessoa),
    addHabilidade: (nome: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_PERFIL_ADD_HABILIDADE, nome),
    removeHabilidade: (idHabilidade: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_PERFIL_REMOVE_HABILIDADE, idHabilidade),
    motivadores: (idPessoa?: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_PERFIL_MOTIVADORES, idPessoa),
    addMotivadores: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_PERFIL_MOTIVADORES_ADD),
    editMotivadores: (ordenados: Array<{ idMotivador: string }>): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_PERFIL_MOTIVADORES_EDIT, ordenados),
    acoes: (idPessoa?: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_PERFIL_ACOES, idPessoa),
    mapping: (idPessoa?: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_PERFIL_MAPPING, idPessoa),
    addMapping: (titulo: string, itens: string[]): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_PERFIL_MAPPING_ADD, { titulo, itens }),
    editMapping: (
      idTitulo: string,
      titulo: string,
      itens: Array<{ IdItem?: string; NomeItem: string }>,
    ): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_PERFIL_MAPPING_EDIT, { idTitulo, titulo, itens }),
    delMapping: (idMapping: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_PERFIL_MAPPING_DEL, idMapping),
    editGet: (idPessoa?: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_PERFIL_EDIT_GET, idPessoa),
    editSave: (patch: {
      nome?: string;
      email?: string;
      miniBio?: string;
      funcaoPrincipal?: string;
      telefone?: string;
      idGestor?: string | null;
      idioma?: number;
      foto?: string;
    }): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_PERFIL_EDIT_SAVE, patch),
    gestores: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_PERFIL_GESTORES),
  },

  // Notificações
  notif: {
    unread: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_NOTIF_UNREAD),
    all: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_NOTIF_ALL),
    markRead: (id: string): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_NOTIF_READ, id),
    markAllRead: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_NOTIF_READ_ALL),
    novidades: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_NOTIF_NOVIDADES),
    novidadesUser: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_NOTIF_NOVIDADES_USER),
    novidadesTotal: (): Promise<ActionResult<number>> =>
      ipcRenderer.invoke(IPC.API_NOTIF_NOVIDADES_TOTAL),
    novidadeMarkRead: (id: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_NOTIF_NOVIDADE_READ, id),
    novidadesMarkAllRead: (): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_NOTIF_NOVIDADES_READ_ALL),
  },

  // Atividades
  atividades: {
    minhas: (): Promise<ActionResult<BeeforAtividade[]>> => ipcRenderer.invoke(IPC.API_ATIV_MINHAS),
    detail: (idCard: string, idTime: string, idOrganizacao?: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_ATIV_DETAIL, { idCard, idTime, idOrganizacao }),
    edit: (
      idCard: string,
      body: Partial<{
        nome: string;
        descricao: string;
        idProjeto: string | null;
        idEpico: string | null;
        idIteracao: string | null;
        nomeIteracao: string | null;
        idColuna: string | null;
        pontuacao: number | string | null;
        bloqueado: boolean;
        motivoBloqueio: string | null;
        idsResponsaveisCard: string[];
        cardEtiquetas: Array<{ idEtiqueta: string; nomeEtiqueta: string; corEtiqueta: string }>;
        esforco: string | null;
        quantidadeVagas: number | string | null;
        dataPrevistaEntrega: string | null;
        tipo: number;
        idCardHistoria: string | null;
        dataInicio: string | null;
      }>,
    ): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_ATIV_EDIT, { idCard, body }),
    arquivar: (idCard: string, arquivado: boolean, idQuadro?: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_ATIV_ARQUIVAR, { idCard, arquivado, idQuadro }),
    logs: (idCard: string): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_ATIV_LOGS, idCard),
    anexos: (idCard: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_ATIV_ANEXOS, idCard),
    removerAnexo: (idAnexo: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_ATIV_ANEXO_DEL, idAnexo),
    adicionarAnexo: (params: {
      idCard: string;
      idTime: string;
      fileName: string;
      fileType: string;
      fileBytes: ArrayBuffer;
    }): Promise<ActionResult> => ipcRenderer.invoke(IPC.API_ATIV_ANEXO_ADD, params),
    comments: (idCard: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_ATIV_COMMENTS, idCard),
    addComment: (idCard: string, texto: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_ATIV_ADD_COMMENT, { idCard, texto }),
    /** Bundle paralelo: card resumo + coluna + comentários (igual front goobeeteams abrindo modal). */
    resumo: (idCard: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_ATIV_RESUMO, idCard),
    responsaveis: (idTime: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_ATIV_RESPONSAVEIS, idTime),
    projetos: (idTime?: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_ATIV_PROJETOS, idTime),
    iteracoes: (idTime: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_ATIV_ITERACOES, idTime),
    etiquetas: (idQuadro: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_ATIV_ETIQUETAS, idQuadro),
    colunas: (idQuadro: string): Promise<ActionResult> =>
      ipcRenderer.invoke(IPC.API_ATIV_COLUNAS, idQuadro),
  },
};

contextBridge.exposeInMainWorld('beefor', api);
contextBridge.exposeInMainWorld('beeforHttp', httpApi);

export type BeeforApi = typeof api;
export type BeeforHttpApi = typeof httpApi;

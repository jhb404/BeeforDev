import { getApiBases } from './env';

export const BEEFOR_URL = (() => getApiBases().appUrl)();

/** API base getters — read env dynamically so env switch takes effect at runtime. */
export const getBeeforApiBase = (): string => getApiBases().teams;
export const getBeeforTimesheetApiBase = (): string => getApiBases().timesheet;
export const getBeeforAppUrl = (): string => getApiBases().appUrl;

export const getBeeforTimesheetApi = (): string => `${getApiBases().timesheet}/apontamento`;
export const getBeeforKudoApi = (): string => `${getApiBases().teams}/KudoCard`;
export const getBeeforPessoaApi = (): string => `${getApiBases().teams}/Pessoa`;
export const getBeeforHomeApi = (): string => `${getApiBases().teams}/Home`;
export const getBeeforTokenApi = (): string => `${getApiBases().teams}/Token`;
export const getBeeforGoogleLoginApi = (): string => `${getApiBases().teams}/Token/LoginComGoogle`;
/** Reidrata a sessão a partir de um JWT ainda válido (usado no refresh do login Google). */
export const getBeeforLoginComTokenApi = (): string => `${getApiBases().teams}/Token/LoginComToken`;

export const getBeeforOrganizacaoApi = (): string => `${getApiBases().teams}/Organizacao`;
export const getBeeforQuadroApi = (): string => `${getApiBases().teams}/Quadro`;

/** Legacy named exports kept for callers that imported strings directly.
 *  These resolve at module load against current env; for env-aware code prefer the getters above. */
export const BEEFOR_API_BASE = getBeeforApiBase();
export const BEEFOR_TIMESHEET_API = getBeeforTimesheetApi();
export const BEEFOR_KUDO_API = getBeeforKudoApi();
export const BEEFOR_PESSOA_API = getBeeforPessoaApi();
export const BEEFOR_HOME_API = getBeeforHomeApi();
export const BEEFOR_LOGIN_URL = `${getBeeforAppUrl()}/login`;
export const BEEFOR_TIMESHEET_URL = `${getBeeforAppUrl()}/time-sheet-beefor/lancamentos`;

export const KEYTAR_SERVICE = 'beefor-dev';
export const KEYTAR_ACCOUNT_EMAIL = 'beefor-email';
export const KEYTAR_ACCOUNT_PASSWORD = 'beefor-password';
/** JWT da sessão Google (login Google não tem senha → guarda o token p/ refresh/restart). */
export const KEYTAR_ACCOUNT_GOOGLE_TOKEN = 'beefor-google-token';
export const KEYTAR_ACCOUNT_COIN2U_EMAIL = 'coin2u-email';
export const KEYTAR_ACCOUNT_COIN2U_PASSWORD = 'coin2u-password';

export const COIN2U_URL = 'https://app.coin2u.com.br';
export const COIN2U_LOGIN_URL = `${COIN2U_URL}/Login/Authenticate`;
export const COIN2U_DASHBOARD_URL = `${COIN2U_URL}/VentronCoins/GetDashboard`;

export const SESSION_FILE = 'beefor-session.json';
export const SETTINGS_FILE = 'beefor-settings.json';

export const DEFAULT_TIMEOUT_MS = 30_000;
export const NAV_TIMEOUT_MS = 45_000;

export type SessionStatus =
  | 'idle'
  | 'loading'
  | 'reconnecting'
  | 'connected'
  | 'disconnected'
  | 'expired'
  | 'error';

export type Mood = 'Dia feliz' | 'Dia bom' | 'Dia não tão bom' | 'Dia triste';

export const MOODS: Mood[] = [
  'Dia feliz',
  'Dia bom',
  'Dia não tão bom',
  'Dia triste',
];

export interface Credentials {
  email: string;
  password: string;
}

export type KudocardFrequency = 'once' | 'twice' | 'custom';

export interface AppSettings {
  autoStart: boolean;
  autoLoginOnLaunch: boolean;

  /** Auto punch base times "HH:MM" (4 entries: entrada, saída almoço, retorno, saída) */
  automatePunch: boolean;
  punchTimes: [string, string, string, string];
  /** Max minutes drift applied randomly per day to each base time */
  punchDriftMinutes: number;

  lunchAlarm: boolean;
  lunchAlarmTime: string; // "HH:MM"

  moodNotification: boolean;
  moodNotificationTime: string; // "HH:MM"
  moodAlarm: boolean;

  kudocardNotification: boolean;
  kudocardFrequency: KudocardFrequency;
  /** Used when frequency === 'custom'. Day numbers 1..31 */
  kudocardDays: number[];
  /** Optional fixed time "HH:MM" for kudocard alerts. When unset, scheduler picks random time. */
  kudocardNotificationTime?: string;
  /**
   * Persisted schedule for the current month so restarts don't re-roll.
   * Key format: "YYYY-M". Value: array of {day, time} sorted by day.
   */
  kudocardSchedule?: { ym: string; slots: Array<{ day: number; time: string }> };

  hoursPerDay: number;
  hourRate: number;
  patchJournal: string;

  /** User dismissed the "run as admin" banner — don't show again */
  adminBannerDismissed?: boolean;

  /** Home layout: 'classic' (table) | 'minimal' (calendar + day panel) */
  viewMode?: 'classic' | 'minimal';

  /** Calendar cells show daily diff (+23m / -10m) instead of status dot */
  calendarShowDiff?: boolean;

  /** Logo variant: 'orange' (default) | 'purple' */
  logoVariant?: 'orange' | 'purple';

  /** UI density */
  uiDensity?: 'compact' | 'normal' | 'comfortable';

  /** Custom theme overrides (CSS variable values) */
  themeOverrides?: Partial<ThemeOverrides>;

  /** UI click/hover sound effects */
  uiSounds?: boolean;

  /** Coin2U userId (numeric) for dashboard fetch — auto-captured on login */
  coin2uUserId?: number;

  /** Full Info object captured at last successful Coin2U login */
  coin2uInfo?: Record<string, unknown>;

  /** Org list returned by /User/GetOrgList — cached for offline UI */
  coin2uOrgs?: Coin2uOrg[];
}

export interface Coin2uDashboard {
  Coins: number;
  CurrentQuotation: number;
  DaysToExpire: number;
  ExchangeCoins: number;
  Members?: Coin2uMember[];
  RecentTransactions?: Coin2uTransaction[];
}

export interface Coin2uCredentials {
  email: string;
  userId?: number;
  connected?: boolean;
}

export interface Coin2uMember {
  Value: number;
  Text: string;
}

export interface Coin2uTransaction {
  TransactionId: number;
  Amount: number;
  FromName: string;
  FromId: number;
  ToName: string;
  ToId: number;
  Date: string;
  ShopItemId?: number | null;
  ShopItemName?: string | null;
  Coins?: number | null;
  Message?: string | null;
  GenesisBookId?: number | null;
  ProviderId?: number | null;
  ProviderIdName?: string | null;
}

export interface Coin2uLog {
  Log: Coin2uTransaction[];
}

export interface Coin2uShopCategory {
  Id: number;
  Decription: string;
  BitActive?: boolean;
}

export interface Coin2uShopItem {
  Id: number;
  Name: string;
  Imagem: string | null;
  Price: number;
  PriceInReal: number;
  LastUpdate: string | null;
  Active: boolean;
  Stock: number;
  Description: string;
  PurchaseInstruction: string | null;
  category?: Coin2uShopCategory | null;
}

export interface Coin2uShop {
  Coins: number;
  ShopItems: Coin2uShopItem[];
}

export interface Coin2uTransferRequest {
  To: number;
  Amount: number;
  Message: string;
}

export interface Coin2uBuyItemRequest {
  shopItemId: number;
  price: number;
}

/** Org row as returned by /User/GetOrgList. Kept loose since schema may grow. */
export interface Coin2uOrg {
  id?: number;
  name?: string;
  [key: string]: unknown;
}

/** Full Info object returned by /Login/Authenticate (data.Info). */
export interface Coin2uInfo {
  UserId: number;
  TokenApi: string;
  Email?: string;
  Name?: string;
  [key: string]: unknown;
}

export interface ThemeOverrides {
  accent: string;
  accentHover: string;
  warm: string;
  ok: string;
  err: string;
  radius: string;
  fontScale: string; // e.g. "0.9" | "1" | "1.1"
}

export interface TodayAlert {
  kind: 'kudocard' | 'mood' | 'lunch' | 'punch' | 'birthday';
  title: string;
  body: string;
  time?: string; // "HH:MM" when scheduled
  snoozedUntil?: string; // "HH:MM" — set client-side to suppress until that time
}

export interface ActionResult<T = void> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface LogEntry {
  ts: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

/** Time as "HH:MM" (24h). Empty string = vazio. */
export type TimeStr = string;

export interface TimesheetEntry {
  date: string;          // ISO yyyy-mm-dd
  entrada: TimeStr;
  int1: TimeStr;
  ret1: TimeStr;
  int2: TimeStr;
  ret2: TimeStr;
  saida: TimeStr;
  comentario?: string;
}

export interface FetchedTimesheetRow extends TimesheetEntry {
  total: string;       // "HH:MM" as reported by Beefor
  status: string;      // "Feriado", etc
  editable: boolean;
}

export type KudoCardRecipientType = 'person' | 'team';

export const KUDO_CARD_TYPES = [
  'Forca_Prancheta_1',
  'Mestre_Prancheta_1',
  'Maravilha_Prancheta_1',
  'Incrivel_Prancheta_1',
  'Imbativel_Prancheta_1',
  'Super_Prancheta_1',
  'Time_Prancheta_1',
  'Parabens_Prancheta_1',
] as const;

export type KudoCardType = (typeof KUDO_CARD_TYPES)[number];

export const KUDO_CARD_LABELS: Record<KudoCardType, string> = {
  Forca_Prancheta_1: 'Obrigado pela força',
  Mestre_Prancheta_1: 'Você é um mestre',
  Maravilha_Prancheta_1: 'Você é uma maravilha',
  Incrivel_Prancheta_1: 'Você é incrível',
  Imbativel_Prancheta_1: 'Você é imbatível',
  Super_Prancheta_1: 'Você é super',
  Time_Prancheta_1: 'Time poderoso',
  Parabens_Prancheta_1: 'Parabéns',
};

export const KUDO_CARD_EMOJI: Record<KudoCardType, string> = {
  Forca_Prancheta_1: '💪',
  Mestre_Prancheta_1: '🧠',
  Maravilha_Prancheta_1: '✨',
  Incrivel_Prancheta_1: '🌟',
  Imbativel_Prancheta_1: '🏆',
  Super_Prancheta_1: '🚀',
  Time_Prancheta_1: '🤝',
  Parabens_Prancheta_1: '🎉',
};

/** Beefor uses 1-based numeric ids for tipoKudoCard, ordered as KUDO_CARD_TYPES. */
export const KUDO_CARD_TIPO_BY_TYPE: Record<KudoCardType, number> = {
  Forca_Prancheta_1: 1,
  Mestre_Prancheta_1: 2,
  Maravilha_Prancheta_1: 3,
  Incrivel_Prancheta_1: 4,
  Imbativel_Prancheta_1: 5,
  Super_Prancheta_1: 6,
  Time_Prancheta_1: 7,
  Parabens_Prancheta_1: 8,
};

export const KUDO_CARD_TYPE_BY_TIPO: Record<number, KudoCardType> = {
  1: 'Forca_Prancheta_1',
  2: 'Mestre_Prancheta_1',
  3: 'Maravilha_Prancheta_1',
  4: 'Incrivel_Prancheta_1',
  5: 'Imbativel_Prancheta_1',
  6: 'Super_Prancheta_1',
  7: 'Time_Prancheta_1',
  8: 'Parabens_Prancheta_1',
};

export interface KudoCardCounts {
  enviados: number;
  recebidos: number;
}

export interface KudoCardListItem {
  id: string;
  mensagemBoxKudoCard: string;
  mensagemKudoCard: string;
  nomeOrganizacao: string;
  destinatario?: string;
  remetente?: string;
  tipoKudoCard: number;
  dataEnvio: string;
}

export interface KudoCardLists {
  enviados: KudoCardListItem[];
  recebidos: KudoCardListItem[];
}

export interface KudoCardDetail {
  id: string | null;
  mensagemBoxKudoCard: string;
  mensagemKudoCard: string;
  nomeOrganizacao: string;
  remetente?: string;
  destinatario?: string;
  imagem?: string | null;
  nomeTraducao?: string | null;
  tipoKudoCard: number;
  times?: unknown[];
  dataEnvio: string;
}

/** Beefor "sentimento" numeric → Mood. Order matches MOODS. */
export const MOOD_BY_SENTIMENTO: Record<number, Mood> = {
  1: 'Dia feliz',
  2: 'Dia bom',
  3: 'Dia não tão bom',
  4: 'Dia triste',
};

export interface KudoSearchResult {
  id: string;
  name: string;
  subtitle?: string;
}

export interface SendKudoCardRequest {
  recipientType: KudoCardRecipientType;
  recipientName: string;
  message: string;
  cardType: KudoCardType;
}

export interface SendKudoCardResult {
  success: boolean;
  message: string;
  details?: unknown;
}

export interface TeamChecklistAnswer {
  titulo: string;
  resposta: string;
}

export interface TeamMember {
  nome: string;
  foto: string;
  funcaoPrincipal: string;
  email: string;
  status: boolean;
  ultimoCliente: string | null;
  ultimoCheckpoint: string | null;
  respostasUltimoChecklist: TeamChecklistAnswer[];
}

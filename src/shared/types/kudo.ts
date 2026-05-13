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

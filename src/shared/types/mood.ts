export type Mood = 'Dia feliz' | 'Dia bom' | 'Dia não tão bom' | 'Dia triste';

export const MOODS: Mood[] = ['Dia feliz', 'Dia bom', 'Dia não tão bom', 'Dia triste'];

/** Beefor "sentimento" numeric → Mood. Order matches MOODS. */
export const MOOD_BY_SENTIMENTO: Record<number, Mood> = {
  1: 'Dia feliz',
  2: 'Dia bom',
  3: 'Dia não tão bom',
  4: 'Dia triste',
};

/**
 * `NovoSentimentoEnum` do goobeeteams: 0 sem sentimento, 1..4 = MOODS, 5 = ausência.
 * Só 5 não tem Mood correspondente — por isso a constante separada.
 */
export const SENTIMENTO_AUSENCIA = 5;

/** Um dia do calendário Niko (mood mês a mês). */
export interface MoodCalendarDia {
  dia: number;
  sentimento: number;
  mood: Mood | null;
  dataCompleta: string;
  comentario: string;
  ausencia: boolean;
}

/** Linha do calendário Niko: uma pessoa e seus dias no mês. */
export interface MoodCalendarPessoa {
  idPessoa: string;
  nomePessoa: string;
  mediaSentimento: number;
  dias: MoodCalendarDia[];
}

/** Alvo do calendário: time OU grupo (espelha PegarCalendarioNiko/…NikoGrupo). */
export interface MoodCalendarQuery {
  idTime?: string;
  idGrupo?: string;
  mes: number;
  ano: number;
}

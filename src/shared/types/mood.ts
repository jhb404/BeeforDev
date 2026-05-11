export type Mood = 'Dia feliz' | 'Dia bom' | 'Dia não tão bom' | 'Dia triste';

export const MOODS: Mood[] = [
  'Dia feliz',
  'Dia bom',
  'Dia não tão bom',
  'Dia triste',
];

/** Beefor "sentimento" numeric → Mood. Order matches MOODS. */
export const MOOD_BY_SENTIMENTO: Record<number, Mood> = {
  1: 'Dia feliz',
  2: 'Dia bom',
  3: 'Dia não tão bom',
  4: 'Dia triste',
};

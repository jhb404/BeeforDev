/**
 * Gamification — TYPES
 *
 * Skeleton apenas. Sem backend. Tudo persistido em localStorage por enquanto.
 * Quando backend existir, trocar `useGamification` para hidratar via IPC.
 */

export type XpAction =
  | 'punch-day' // bateu ponto no dia
  | 'mood-day' // colocou mood no dia
  | 'kudo-sent' // enviou kudocard
  | 'auto-lancamento' // rodou auto lançamento
  | 'streak-7' // 7 dias seguidos
  | 'streak-30' // 30 dias seguidos
  | 'open-app'; // primeira abertura do dia

export const XP_REWARDS: Record<XpAction, { xp: number; label: string; hint: string }> = {
  'punch-day': { xp: 20, label: 'Bater ponto', hint: 'Lança ao menos 1 horário no dia' },
  'mood-day': { xp: 10, label: 'Mood diário', hint: 'Registra como você está hoje' },
  'kudo-sent': { xp: 40, label: 'Enviar KudoCard', hint: 'Reconhecer alguém do time' },
  'auto-lancamento': { xp: 30, label: 'Auto lançamento', hint: 'Lança o mês inteiro de uma vez' },
  'streak-7': { xp: 100, label: 'Streak de 7 dias', hint: 'Mood preenchido 7 dias seguidos' },
  'streak-30': { xp: 500, label: 'Streak de 30 dias', hint: 'Mood preenchido o mês inteiro' },
  'open-app': { xp: 5, label: 'Abrir o app', hint: 'Login da primeira vez no dia' },
};

export interface Achievement {
  id: string;
  icon: string;
  label: string;
  description: string;
  /** Condition checker — receives current stats, returns true if unlocked. */
  check: (stats: UserStats) => boolean;
  /** Optional reward when unlocked. */
  rewards?: {
    /** Theme preset ID this achievement unlocks. */
    themePreset?: string;
    /** App icon variant this unlocks. */
    iconVariant?: string;
    /** XP bonus. */
    xpBonus?: number;
  };
}

export interface UserStats {
  level: number;
  xp: number;
  xpNext: number;
  moodStreak: number; // mood consecutive days
  punchStreak: number; // punch consecutive days
  totalLancamentos: number;
  totalKudos: number;
  totalAutoLancamentos: number;
  coinsGanhos: number;
  unlockedAchievementIds: string[];
  unlockedThemePresetIds: string[];
  unlockedIconVariantIds: string[];
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  /** Achievement ID required (or null = always unlocked). */
  requires: string | null;
  /** CSS vars applied as themeOverrides. */
  tokens: Record<string, string>;
  /** Visual swatches for preview. */
  swatches: [string, string, string];
}

export interface IconVariant {
  id: string;
  name: string;
  description: string;
  /** Achievement ID required (or null = always unlocked). */
  requires: string | null;
  /** Emoji or short SVG fragment for preview. */
  preview: string;
}

/** Default empty stats — used when no localStorage. */
export const DEFAULT_STATS: UserStats = {
  level: 1,
  xp: 0,
  xpNext: 100,
  moodStreak: 0,
  punchStreak: 0,
  totalLancamentos: 0,
  totalKudos: 0,
  totalAutoLancamentos: 0,
  coinsGanhos: 0,
  unlockedAchievementIds: [],
  unlockedThemePresetIds: ['default'],
  unlockedIconVariantIds: ['orange'],
};

/** Mock stats — for demo until backend lands. Comment when going prod. */
export const MOCK_STATS: UserStats = {
  level: 7,
  xp: 1240,
  xpNext: 2000,
  moodStreak: 12,
  punchStreak: 8,
  totalLancamentos: 87,
  totalKudos: 14,
  totalAutoLancamentos: 5,
  coinsGanhos: 3200,
  unlockedAchievementIds: ['first-lancar', 'mood-week', 'kudo-giver'],
  unlockedThemePresetIds: ['default', 'forest'],
  unlockedIconVariantIds: ['orange', 'crowned'],
};

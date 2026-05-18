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
  /**
   * Per-theme CSS var tokens. Resolved at apply time based on current
   * `data-theme`. Provider reads `tokens[currentTheme]` and applies as
   * inline CSS custom properties.
   */
  tokens: {
    dark: Record<string, string>;
    light: Record<string, string>;
  };
  /** Visual swatches for preview (theme-agnostic). */
  swatches: [string, string, string];
  /** Hidden from picker (work-in-progress / unreleased). */
  hidden?: boolean;
}

export interface IconVariant {
  id: string;
  name: string;
  description: string;
  /** Achievement ID required (or null = always unlocked). */
  requires: string | null;
  /** Emoji shown as overlay (top-right corner). */
  overlay?: string;
  /** Color applied to BeeforLogo (CSS color). */
  color: string;
  /** Extra CSS class applied to the preview wrapper for FX (filter/glow/anim). */
  effectClass?: string;
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
  level: 6,
  xp: 540,
  xpNext: 800,
  moodStreak: 12,
  punchStreak: 8,
  totalLancamentos: 45,
  totalKudos: 6,
  totalAutoLancamentos: 4,
  coinsGanhos: 320,
  unlockedAchievementIds: ['first-lancar', 'mood-first', 'kudo-first', 'auto-lancar-first'],
  unlockedThemePresetIds: ['default', 'dusk', 'slate', 'ember'],
  unlockedIconVariantIds: ['orange'],
};

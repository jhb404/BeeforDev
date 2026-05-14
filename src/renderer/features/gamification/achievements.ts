import type { Achievement } from './types';

/**
 * Catálogo de conquistas — progressão de fácil → muito difícil.
 *
 * Idéia: usuário começa desbloqueando coisas nos primeiros dias (manter engajamento),
 * progride para metas semanais, depois mensais. `beefor-master` é o platinum.
 *
 * `rewards.themePreset` → desbloqueia preset
 * `rewards.iconVariant` → desbloqueia variante de ícone
 * `rewards.xpBonus` → XP extra no momento do unlock
 */
export const ACHIEVEMENTS: Achievement[] = [
  // ===== TIER 1: Onboarding (primeiros minutos/dias) =====
  {
    id: 'first-lancar',
    icon: '⚡',
    label: 'Primeiro lançamento',
    description: 'Bata seu primeiro ponto.',
    check: (s) => s.totalLancamentos >= 1,
  },
  {
    id: 'mood-first',
    icon: '🙂',
    label: 'Como você tá?',
    description: 'Registre seu primeiro mood.',
    check: (s) => s.moodStreak >= 1,
  },
  {
    id: 'kudo-first',
    icon: '👋',
    label: 'Primeira gentileza',
    description: 'Envie seu primeiro KudoCard.',
    check: (s) => s.totalKudos >= 1,
  },
  {
    id: 'auto-lancar-first',
    icon: '🤖',
    label: 'Automatizou!',
    description: 'Rode auto lançamento pela primeira vez.',
    check: (s) => s.totalAutoLancamentos >= 1,
  },

  // ===== TIER 2: Semanal (3-7 dias) =====
  {
    id: 'mood-week',
    icon: '😄',
    label: 'Semana feliz',
    description: 'Registre seu mood 7 dias seguidos.',
    check: (s) => s.moodStreak >= 7,
  },
  {
    id: 'punch-week',
    icon: '⏱️',
    label: 'Pontualidade',
    description: 'Bata ponto 7 dias seguidos.',
    check: (s) => s.punchStreak >= 7,
  },
  {
    id: 'kudo-5',
    icon: '🌟',
    label: 'Pessoa do bem',
    description: 'Envie 5 KudoCards.',
    check: (s) => s.totalKudos >= 5,
  },
  {
    id: 'lvl-5',
    icon: '🎖️',
    label: 'Nível 5',
    description: 'Alcance o nível 5.',
    check: (s) => s.level >= 5,
  },

  // ===== TIER 3: Quinzenal/Mensal (14-30 dias) =====
  {
    id: 'mood-2-weeks',
    icon: '😎',
    label: 'Quinzena de mood',
    description: '14 dias seguidos de mood.',
    check: (s) => s.moodStreak >= 14,
    rewards: { themePreset: 'forest', xpBonus: 150 },
  },
  {
    id: 'kudo-10',
    icon: '🎁',
    label: 'Generoso',
    description: 'Envie 10 KudoCards.',
    check: (s) => s.totalKudos >= 10,
    rewards: { themePreset: 'ocean', xpBonus: 100 },
  },
  {
    id: 'lancar-month',
    icon: '📅',
    label: 'Mês completo',
    description: '22 dias úteis lançados num mês.',
    check: (s) => s.totalLancamentos >= 22,
    rewards: { themePreset: 'sakura' },
  },
  {
    id: 'auto-lancar-5',
    icon: '⚙️',
    label: 'Eficiência',
    description: 'Auto lançamento 5 vezes.',
    check: (s) => s.totalAutoLancamentos >= 5,
    rewards: { themePreset: 'mint' },
  },
  {
    id: 'lvl-10',
    icon: '🌟',
    label: 'Nível 10',
    description: 'Alcance o nível 10.',
    check: (s) => s.level >= 10,
    rewards: { themePreset: 'lavender', iconVariant: 'galaxy', xpBonus: 200 },
  },

  // ===== TIER 4: Difícil (1-3 meses) =====
  {
    id: 'mood-month',
    icon: '🔥',
    label: 'Streak de fogo',
    description: 'Mood preenchido 30 dias seguidos.',
    check: (s) => s.moodStreak >= 30,
    rewards: { themePreset: 'inferno', iconVariant: 'flame', xpBonus: 500 },
  },
  {
    id: 'punch-month',
    icon: '⌚',
    label: 'Pontual mensal',
    description: 'Bata ponto 30 dias seguidos.',
    check: (s) => s.punchStreak >= 30,
    rewards: { themePreset: 'sunset', xpBonus: 500 },
  },
  {
    id: 'kudo-master',
    icon: '👑',
    label: 'Rei dos Kudos',
    description: 'Envie 50 KudoCards.',
    check: (s) => s.totalKudos >= 50,
    rewards: { themePreset: 'royal', iconVariant: 'crowned', xpBonus: 300 },
  },
  {
    id: 'coin-collector',
    icon: '💰',
    label: 'Cofrinho',
    description: 'Acumule 5.000 coins.',
    check: (s) => s.coinsGanhos >= 5000,
    rewards: { themePreset: 'mocha', xpBonus: 200 },
  },
  {
    id: 'auto-lancar-pro',
    icon: '🚀',
    label: 'Automatizador Pro',
    description: 'Auto lançamento 20 vezes.',
    check: (s) => s.totalAutoLancamentos >= 20,
    rewards: { iconVariant: 'trophy', xpBonus: 300 },
  },

  // ===== TIER 5: Muito difícil (3-6 meses) =====
  {
    id: 'mood-2-months',
    icon: '🌋',
    label: 'Vulcão de mood',
    description: '60 dias seguidos de mood.',
    check: (s) => s.moodStreak >= 60,
    rewards: { themePreset: 'cyber', xpBonus: 800 },
  },
  {
    id: 'lvl-25',
    icon: '💎',
    label: 'Nível 25',
    description: 'Alcance o nível 25.',
    check: (s) => s.level >= 25,
    rewards: { themePreset: 'diamond', iconVariant: 'diamond', xpBonus: 600 },
  },
  {
    id: 'kudo-legend',
    icon: '🏆',
    label: 'Lenda do KudoCard',
    description: 'Envie 100 KudoCards.',
    check: (s) => s.totalKudos >= 100,
    rewards: { themePreset: 'gold', xpBonus: 1000 },
  },
  {
    id: 'coin-millionaire',
    icon: '💸',
    label: 'Milionário',
    description: 'Acumule 50.000 coins.',
    check: (s) => s.coinsGanhos >= 50000,
    rewards: { xpBonus: 1500 },
  },

  // ===== TIER 6: Endgame (6+ meses) =====
  {
    id: 'mood-100',
    icon: '☄️',
    label: 'Cometa',
    description: '100 dias seguidos de mood. TA FELIZ AGR!?',
    check: (s) => s.moodStreak >= 100,
    rewards: { xpBonus: 2000 },
  },
  {
    id: 'lvl-50',
    icon: '🌠',
    label: 'Nível 50',
    description: 'Alcance o nível 50. Viciadinho...',
    check: (s) => s.level >= 50,
    rewards: { xpBonus: 3000 },
  },
  {
    id: 'beefor-master',
    icon: '🐝',
    label: 'Beefor Master',
    description: 'Desbloqueie todas as outras 24 conquistas.',
    check: (s) => s.unlockedAchievementIds.length >= 24,
    rewards: { themePreset: 'master', iconVariant: 'master', xpBonus: 5000 },
  },
];

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

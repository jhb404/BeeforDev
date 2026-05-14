import type { Achievement } from './types';

/**
 * Catálogo de conquistas. Add aqui novas. Cada uma:
 * - rewards.themePreset → desbloqueia preset visual
 * - rewards.iconVariant → desbloqueia variante de ícone do app
 */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-lancar',
    icon: '⚡',
    label: 'Primeiro lançamento',
    description: 'Bata seu primeiro ponto.',
    check: (s) => s.totalLancamentos >= 1,
  },
  {
    id: 'mood-week',
    icon: '😄',
    label: '7 dias de mood',
    description: 'Registre seu mood 7 dias seguidos.',
    check: (s) => s.moodStreak >= 7,
  },
  {
    id: 'mood-month',
    icon: '🔥',
    label: 'Streak de fogo',
    description: 'Mood preenchido 30 dias seguidos.',
    check: (s) => s.moodStreak >= 30,
    rewards: { themePreset: 'inferno', iconVariant: 'flame', xpBonus: 500 },
  },
  {
    id: 'kudo-giver',
    icon: '🎁',
    label: 'Generoso',
    description: 'Envie 10 KudoCards.',
    check: (s) => s.totalKudos >= 10,
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
    id: 'kudo-legend',
    icon: '🏆',
    label: 'Lenda do KudoCard',
    description: 'Envie 100 KudoCards.',
    check: (s) => s.totalKudos >= 100,
    rewards: { themePreset: 'gold', iconVariant: 'trophy', xpBonus: 1000 },
  },
  {
    id: 'lvl-10',
    icon: '🌟',
    label: 'Nível 10',
    description: 'Alcance o nível 10.',
    check: (s) => s.level >= 10,
    rewards: { themePreset: 'galaxy', xpBonus: 200 },
  },
  {
    id: 'lvl-25',
    icon: '💎',
    label: 'Nível 25',
    description: 'Alcance o nível 25.',
    check: (s) => s.level >= 25,
    rewards: { themePreset: 'diamond', iconVariant: 'diamond' },
  },
  {
    id: 'coin-collector',
    icon: '💰',
    label: 'Cofrinho',
    description: 'Acumule 5.000 coins.',
    check: (s) => s.coinsGanhos >= 5000,
  },
  {
    id: 'auto-lancamento-pro',
    icon: '🤖',
    label: 'Automatizador',
    description: 'Rode auto lançamento 10 vezes.',
    check: (s) => s.totalAutoLancamentos >= 10,
  },
  {
    id: 'beefor-master',
    icon: '🐝',
    label: 'Beefor Master',
    description: 'Complete todas as conquistas.',
    check: (s) => s.unlockedAchievementIds.length >= 10,
    rewards: { themePreset: 'master', iconVariant: 'master', xpBonus: 2000 },
  },
];

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

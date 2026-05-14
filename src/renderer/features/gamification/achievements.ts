import type { Achievement } from './types';

/**
 * Catálogo de conquistas — progressão fácil → muito difícil.
 *
 * Filosofia:
 * - Onboarding (Tier 1): primeiros minutos, recompensa quase imediata
 * - Curiosidades (Tier 2): explorar features do app
 * - Hábitos diários (Tier 3): 7-14 dias de consistência
 * - Mensal (Tier 4): 22-30 dias úteis
 * - Difícil (Tier 5): 60+ dias, kudo no ano todo
 * - Endgame (Tier 6): platinum
 *
 * Targets calibrados pra realidade: ~2 kudos/mês, coins acumula devagar.
 *
 * `rewards.themePreset` → desbloqueia preset
 * `rewards.iconVariant` → desbloqueia variante de ícone
 * `rewards.xpBonus` → XP extra no momento do unlock
 */
export const ACHIEVEMENTS: Achievement[] = [
  // ===== TIER 1: Onboarding (primeiros usos) =====
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

  // ===== TIER 2: Curiosidade / Exploração =====
  {
    id: 'explorer',
    icon: '🧭',
    label: 'Explorador',
    description: 'Alcance o nível 3.',
    check: (s) => s.level >= 3,
    rewards: { themePreset: 'ocean', xpBonus: 50 },
  },
  {
    id: 'coin-starter',
    icon: '🪙',
    label: 'Primeiras moedas',
    description: 'Acumule 100 coins.',
    check: (s) => s.coinsGanhos >= 100,
  },
  {
    id: 'mood-3-days',
    icon: '😊',
    label: 'Três diazinhos',
    description: 'Mood marcado 3 dias seguidos.',
    check: (s) => s.moodStreak >= 3,
  },
  {
    id: 'punch-3-days',
    icon: '👊',
    label: 'Consistência',
    description: 'Bata ponto 3 dias seguidos.',
    check: (s) => s.punchStreak >= 3,
  },

  // ===== TIER 3: Hábitos semanais =====
  {
    id: 'mood-week',
    icon: '😄',
    label: 'Semana feliz',
    description: 'Mood preenchido 7 dias seguidos.',
    check: (s) => s.moodStreak >= 7,
    rewards: { themePreset: 'mint', xpBonus: 100 },
  },
  {
    id: 'punch-week',
    icon: '⏱️',
    label: 'Pontualidade',
    description: 'Ponto batido 7 dias seguidos.',
    check: (s) => s.punchStreak >= 7,
    rewards: { themePreset: 'lavender', xpBonus: 100 },
  },
  {
    id: 'lvl-5',
    icon: '🎖️',
    label: 'Nível 5',
    description: 'Alcance o nível 5.',
    check: (s) => s.level >= 5,
    rewards: { themePreset: 'sakura', xpBonus: 100 },
  },
  {
    id: 'kudo-5',
    icon: '🌟',
    label: 'Pessoa do bem',
    description: 'Envie 5 KudoCards.',
    check: (s) => s.totalKudos >= 5,
    rewards: { themePreset: 'forest', xpBonus: 150 },
  },
  {
    id: 'auto-lancar-3',
    icon: '⚙️',
    label: 'Time saver',
    description: 'Auto lançamento 3 vezes.',
    check: (s) => s.totalAutoLancamentos >= 3,
    rewards: { themePreset: 'sunset', xpBonus: 100 },
  },

  // ===== TIER 4: Mensal =====
  {
    id: 'mood-2-weeks',
    icon: '😎',
    label: 'Quinzena de mood',
    description: '14 dias seguidos de mood.',
    check: (s) => s.moodStreak >= 14,
    rewards: { themePreset: 'mocha', xpBonus: 200 },
  },
  {
    id: 'lancar-month',
    icon: '📅',
    label: 'Mês completo',
    description: '22 lançamentos no total (1 mês útil).',
    check: (s) => s.totalLancamentos >= 22,
    rewards: { iconVariant: 'galaxy', xpBonus: 200 },
  },
  {
    id: 'lvl-10',
    icon: '🌟',
    label: 'Nível 10',
    description: 'Alcance o nível 10.',
    check: (s) => s.level >= 10,
    rewards: { themePreset: 'cyber', xpBonus: 300 },
  },
  {
    id: 'kudo-10',
    icon: '🎁',
    label: 'Generoso',
    description: 'Envie 10 KudoCards (~5 meses).',
    check: (s) => s.totalKudos >= 10,
    rewards: { themePreset: 'royal', iconVariant: 'crowned', xpBonus: 300 },
  },
  {
    id: 'coin-saver',
    icon: '💰',
    label: 'Poupador',
    description: 'Acumule 500 coins.',
    check: (s) => s.coinsGanhos >= 500,
    rewards: { xpBonus: 200 },
  },

  // ===== TIER 5: Difícil =====
  {
    id: 'mood-month',
    icon: '🔥',
    label: 'Streak de fogo',
    description: '30 dias seguidos de mood.',
    check: (s) => s.moodStreak >= 30,
    rewards: { themePreset: 'inferno', iconVariant: 'flame', xpBonus: 500 },
  },
  {
    id: 'punch-month',
    icon: '⌚',
    label: 'Pontual mensal',
    description: '30 dias seguidos de ponto.',
    check: (s) => s.punchStreak >= 30,
    rewards: { iconVariant: 'trophy', xpBonus: 400 },
  },
  {
    id: 'coin-collector',
    icon: '💎',
    label: 'Cofrinho cheio',
    description: 'Acumule 1.000 coins.',
    check: (s) => s.coinsGanhos >= 1000,
    rewards: { themePreset: 'diamond', xpBonus: 400 },
  },
  {
    id: 'kudo-25',
    icon: '👑',
    label: 'Rei dos Kudos',
    description: 'Envie 25 KudoCards (~1 ano).',
    check: (s) => s.totalKudos >= 25,
    rewards: { themePreset: 'gold', iconVariant: 'diamond', xpBonus: 600 },
  },
  {
    id: 'lvl-20',
    icon: '🌠',
    label: 'Nível 20',
    description: 'Alcance o nível 20.',
    check: (s) => s.level >= 20,
    rewards: { themePreset: 'galaxy', xpBonus: 500 },
  },

  // ===== TIER 6: Endgame =====
  {
    id: 'mood-2-months',
    icon: '🌋',
    label: 'Vulcão',
    description: '60 dias seguidos de mood.',
    check: (s) => s.moodStreak >= 60,
    rewards: { xpBonus: 1000 },
  },
  {
    id: 'lvl-30',
    icon: '☄️',
    label: 'Nível 30',
    description: 'Alcance o nível 30 — você joga há tempo.',
    check: (s) => s.level >= 30,
    rewards: { xpBonus: 1500 },
  },
  {
    id: 'beefor-master',
    icon: '🐝',
    label: 'Beefor Master',
    description: 'Desbloqueie as outras 25 conquistas. Platinum.',
    check: (s) => s.unlockedAchievementIds.length >= 25,
    rewards: { themePreset: 'master', iconVariant: 'master', xpBonus: 5000 },
  },
];

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

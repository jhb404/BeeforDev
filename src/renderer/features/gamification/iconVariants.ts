import type { IconVariant } from './types';

/**
 * App icon variants. Aplica no avatar/profile.
 * Cada variant renderiza `<BeeforLogo>` SVG tingido com `color` + overlay opcional.
 * `effectClass` aplica filtros/animações CSS (drop-shadow glow, pulse, etc).
 */
export const ICON_VARIANTS: IconVariant[] = [
  {
    id: 'orange',
    name: 'Abelha laranja',
    description: 'Logo padrão do Beefor.',
    requires: null,
    color: 'var(--warm)',
  },
  {
    id: 'purple',
    name: 'Abelha real',
    description: 'Variante roxa, sempre disponível.',
    requires: null,
    color: 'var(--accent)',
  },
  {
    id: 'flame',
    name: 'Abelha em chamas',
    description: 'Streak de 30 dias.',
    requires: 'mood-month',
    color: '#dc2626',
    overlay: '🔥',
    effectClass: 'logo-fx-flame',
  },
  {
    id: 'crowned',
    name: 'Abelha coroada',
    description: 'Rei dos KudoCards.',
    requires: 'kudo-master',
    color: '#fbbf24',
    overlay: '👑',
    effectClass: 'logo-fx-crown',
  },
  {
    id: 'trophy',
    name: 'Abelha troféu',
    description: 'Lenda do KudoCard.',
    requires: 'kudo-legend',
    color: '#f59e0b',
    overlay: '🏆',
    effectClass: 'logo-fx-trophy',
  },
  {
    id: 'galaxy',
    name: 'Abelha estelar',
    description: 'Nível 10 alcançado.',
    requires: 'lvl-10',
    color: '#a855f7',
    overlay: '✨',
    effectClass: 'logo-fx-galaxy',
  },
  {
    id: 'diamond',
    name: 'Abelha diamante',
    description: 'Nível 25 alcançado.',
    requires: 'lvl-25',
    color: '#60a5fa',
    overlay: '💎',
    effectClass: 'logo-fx-diamond',
  },
  {
    id: 'master',
    name: 'Abelha mestre',
    description: 'Conquista suprema.',
    requires: 'beefor-master',
    color: '#fbbf24',
    overlay: '🌟',
    effectClass: 'logo-fx-master',
  },
];

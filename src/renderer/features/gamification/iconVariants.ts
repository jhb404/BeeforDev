import type { IconVariant } from './types';

/**
 * App icon variants. Aplica no avatar/tray/profile.
 * Implementação futura: trocar asset do tray quando user picks.
 */
export const ICON_VARIANTS: IconVariant[] = [
  {
    id: 'orange',
    name: 'Abelha laranja',
    description: 'Logo padrão do Beefor.',
    requires: null,
    preview: '🐝',
  },
  {
    id: 'purple',
    name: 'Abelha roxa',
    description: 'Variante alternativa.',
    requires: null,
    preview: '🟣',
  },
  {
    id: 'flame',
    name: 'Abelha em chamas',
    description: 'Desbloqueado com streak de 30 dias.',
    requires: 'mood-month',
    preview: '🔥',
  },
  {
    id: 'crowned',
    name: 'Abelha coroada',
    description: 'Rei dos KudoCards.',
    requires: 'kudo-master',
    preview: '👑',
  },
  {
    id: 'trophy',
    name: 'Abelha troféu',
    description: 'Lenda do KudoCard.',
    requires: 'kudo-legend',
    preview: '🏆',
  },
  {
    id: 'diamond',
    name: 'Abelha diamante',
    description: 'Nível 25 alcançado.',
    requires: 'lvl-25',
    preview: '💎',
  },
  {
    id: 'master',
    name: 'Abelha mestre',
    description: 'Conquista suprema.',
    requires: 'beefor-master',
    preview: '🌟',
  },
];

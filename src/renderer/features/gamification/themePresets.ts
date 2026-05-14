import type { ThemePreset } from './types';

/**
 * Theme presets. `requires: null` = sempre disponível.
 * `requires: '<achievement-id>'` = locked até desbloquear.
 */
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Padrão',
    description: 'Roxo + laranja, tema oficial.',
    requires: null,
    tokens: {},
    swatches: ['#7c5cbf', '#e6a817', '#27b899'],
  },
  {
    id: 'ocean',
    name: 'Oceano',
    description: 'Azul calmo, tons frios.',
    requires: null,
    tokens: { accent: '#3b82f6', warm: '#06b6d4', ok: '#10b981' },
    swatches: ['#3b82f6', '#06b6d4', '#10b981'],
  },
  {
    id: 'forest',
    name: 'Floresta',
    description: 'Verde escuro, natureza.',
    requires: 'mood-week',
    tokens: { accent: '#10b981', warm: '#84cc16', ok: '#22c55e' },
    swatches: ['#10b981', '#84cc16', '#22c55e'],
  },
  {
    id: 'inferno',
    name: 'Inferno',
    description: 'Vermelho intenso, streak de fogo.',
    requires: 'mood-month',
    tokens: { accent: '#dc2626', warm: '#f97316', ok: '#fbbf24' },
    swatches: ['#dc2626', '#f97316', '#fbbf24'],
  },
  {
    id: 'royal',
    name: 'Realeza',
    description: 'Roxo + dourado, rei dos kudos.',
    requires: 'kudo-master',
    tokens: { accent: '#8b5cf6', warm: '#fbbf24', ok: '#a78bfa' },
    swatches: ['#8b5cf6', '#fbbf24', '#a78bfa'],
  },
  {
    id: 'gold',
    name: 'Ouro',
    description: 'Dourado puro, lenda.',
    requires: 'kudo-legend',
    tokens: { accent: '#fbbf24', warm: '#f59e0b', ok: '#facc15' },
    swatches: ['#fbbf24', '#f59e0b', '#facc15'],
  },
  {
    id: 'galaxy',
    name: 'Galáxia',
    description: 'Roxo profundo + rosa neon.',
    requires: 'lvl-10',
    tokens: { accent: '#a855f7', warm: '#ec4899', ok: '#6366f1' },
    swatches: ['#a855f7', '#ec4899', '#6366f1'],
  },
  {
    id: 'diamond',
    name: 'Diamante',
    description: 'Branco azulado, cristalino.',
    requires: 'lvl-25',
    tokens: { accent: '#60a5fa', warm: '#e0f2fe', ok: '#a5f3fc' },
    swatches: ['#60a5fa', '#e0f2fe', '#a5f3fc'],
  },
  {
    id: 'master',
    name: 'Mestre',
    description: 'Tema exclusivo do Beefor Master.',
    requires: 'beefor-master',
    tokens: { accent: '#000000', warm: '#fbbf24', ok: '#dc2626' },
    swatches: ['#000000', '#fbbf24', '#dc2626'],
  },
];

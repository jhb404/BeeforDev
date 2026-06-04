export { useGamification } from './useGamification';
export { StreakRankingModal } from './components/StreakRankingModal';
export { MoodStreakBadge } from './components/MoodStreakBadge';
export { UnlockCodeModal } from './components/UnlockCodeModal';
export { ACHIEVEMENTS, achievementById, TIERS } from './achievements';
export type { TierMeta } from './achievements';
export { THEME_PRESETS, resolvePresetTokens } from './themePresets';
export { ICON_VARIANTS } from './iconVariants';
export { XP_REWARDS } from './types';
export {
  validateThemeCode,
  validateIconCode,
  redeemTheme,
  redeemIcon,
  getRedeemedThemes,
  getRedeemedIcons,
} from './unlockCodes';
export type { Achievement, IconVariant, ThemePreset, UserStats, XpAction } from './types';

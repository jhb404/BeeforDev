import { useEffect, useState } from 'react';
import { ACHIEVEMENTS } from './achievements';
import { ICON_VARIANTS } from './iconVariants';
import { THEME_PRESETS } from './themePresets';
import { loadStats, saveStats } from './store';
import { getRedeemedIcons, getRedeemedThemes } from './unlockCodes';
import type { UserStats } from './types';
import { APP_EVENTS, onAppEvent } from '../../app/events';

export interface GamificationData {
  stats: UserStats;
  unlocked: {
    achievements: typeof ACHIEVEMENTS;
    locked: typeof ACHIEVEMENTS;
  };
  themePresets: typeof THEME_PRESETS;
  iconVariants: typeof ICON_VARIANTS;
  isAchievementUnlocked: (id: string) => boolean;
  isThemePresetUnlocked: (id: string) => boolean;
  isIconUnlocked: (id: string) => boolean;
  refresh: () => void;
}

export function useGamification(): GamificationData {
  const [stats, setStats] = useState<UserStats>(loadStats);
  const [redeemedThemes, setRedeemedThemes] = useState<string[]>(getRedeemedThemes);
  const [redeemedIcons, setRedeemedIcons] = useState<string[]>(getRedeemedIcons);

  const refresh = () => {
    setStats(loadStats());
    setRedeemedThemes(getRedeemedThemes());
    setRedeemedIcons(getRedeemedIcons());
  };

  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  // Listen for unlock-code redemptions (other components dispatch this event)
  useEffect(() => {
    const onCodes = () => {
      setRedeemedThemes(getRedeemedThemes());
      setRedeemedIcons(getRedeemedIcons());
    };
    return onAppEvent(APP_EVENTS.CODES_CHANGED, onCodes);
  }, []);

  const unlockedIds = new Set(stats.unlockedAchievementIds);
  const redeemedThemeSet = new Set(redeemedThemes);
  const redeemedIconSet = new Set(redeemedIcons);

  const isAchievementUnlocked = (id: string) => unlockedIds.has(id);
  const isThemePresetUnlocked = (id: string) => {
    if (redeemedThemeSet.has(id)) return true;
    const p = THEME_PRESETS.find((t) => t.id === id);
    if (!p) return false;
    if (p.requires === null) return true;
    return unlockedIds.has(p.requires);
  };
  const isIconUnlocked = (id: string) => {
    if (redeemedIconSet.has(id)) return true;
    const v = ICON_VARIANTS.find((i) => i.id === id);
    if (!v) return false;
    if (v.requires === null) return true;
    return unlockedIds.has(v.requires);
  };

  return {
    stats,
    unlocked: {
      achievements: ACHIEVEMENTS.filter((a) => isAchievementUnlocked(a.id)),
      locked: ACHIEVEMENTS.filter((a) => !isAchievementUnlocked(a.id)),
    },
    themePresets: THEME_PRESETS,
    iconVariants: ICON_VARIANTS,
    isAchievementUnlocked,
    isThemePresetUnlocked,
    isIconUnlocked,
    refresh,
  };
}

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppSettings } from '@shared/types/index';
import { useIpc } from '../../services/ipc';
import { resolvePresetTokens } from '../../features/gamification';
import { APP_EVENTS, onAppEvent } from '../events';

type SettingsCtx = {
  settings: AppSettings | null;
  reload: () => void;
};

const Ctx = createContext<SettingsCtx | null>(null);

function applyDensity(density: AppSettings['uiDensity']) {
  document.documentElement.dataset.density = density ?? 'normal';
}

/**
 * Tokens controllable via theme presets / editor. Listed explicitly so
 * a reset can call removeProperty on every one — otherwise old values stick.
 */
const THEME_TOKEN_KEYS = [
  'accent',
  'accent-hover',
  'accent-soft',
  'accent-2',
  'accent-2-soft',
  'warm',
  'warm-hover',
  'ok',
  'ok-border',
  'warn',
  'err',
  'err-border',
  'bg-0',
  'bg-1',
  'bg-2',
  'bg-3',
  'text',
  'text-muted',
  'border',
  'border-strong',
  'topbar-bg',
  'panel-bg',
  'toolbar-bg',
  'summary-bg',
  'head-bg',
  'row-bg',
  'row-alt',
  'input-bg',
  'focus-ring',
  'tab-active-bg',
  'tab-active-text',
  'tab-active-border',
  'text-on-warm',
  'text-on-accent',
  'today-accent',
  'weekend-bg',
  'today-bg',
  'radius',
] as const;

const KEY_ALIASES: Record<string, string> = {
  accentHover: 'accent-hover',
  warmHover: 'warm-hover',
  borderStrong: 'border-strong',
  textMuted: 'text-muted',
  accentSoft: 'accent-soft',
  accent2: 'accent-2',
  accent2Soft: 'accent-2-soft',
};

function currentThemeMode(): 'dark' | 'light' {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function applyThemeTokens(presetId: string | undefined, overrides: AppSettings['themeOverrides']) {
  const el = document.documentElement;

  // Reset everything first → presets / "Resetar tema" actually take effect.
  for (const k of THEME_TOKEN_KEYS) {
    el.style.removeProperty(`--${k}`);
  }
  el.style.removeProperty('font-size');

  // 1. Apply preset (resolved for current theme mode)
  const presetTokens = resolvePresetTokens(presetId, currentThemeMode());
  for (const [rawKey, value] of Object.entries(presetTokens)) {
    if (!value) continue;
    const cssKey = KEY_ALIASES[rawKey] ?? rawKey;
    el.style.setProperty(`--${cssKey}`, value);
  }

  // 2. Apply manual overrides on top
  if (!overrides) return;
  for (const [rawKey, value] of Object.entries(overrides)) {
    if (!value) continue;
    const cssKey = KEY_ALIASES[rawKey] ?? rawKey;
    if (cssKey === 'fontScale') {
      el.style.setProperty('font-size', `${Number(value) * 14}px`);
    } else {
      el.style.setProperty(`--${cssKey}`, value);
    }
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { settings: settingsClient } = useIpc();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const load = useCallback(() => {
    void settingsClient.get().then((s) => {
      setSettings(s);
      applyDensity(s.uiDensity);
      applyThemeTokens(s.themePresetId, s.themeOverrides);
    });
  }, [settingsClient]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = () => load();
    return onAppEvent(APP_EVENTS.SETTINGS_CHANGED, handler);
  }, [load]);

  // Re-apply preset whenever theme toggle changes data-theme on <html>.
  // ThemeProvider sets data-theme synchronously, but preset tokens differ between
  // dark/light → must re-resolve. Watch via MutationObserver.
  useEffect(() => {
    const root = document.documentElement;
    const obs = new MutationObserver(() => {
      if (settings) applyThemeTokens(settings.themePresetId, settings.themeOverrides);
    });
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, [settings]);

  return <Ctx.Provider value={{ settings, reload: load }}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSettings must be used inside SettingsProvider');
  return v;
}

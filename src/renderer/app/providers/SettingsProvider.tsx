import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppSettings } from '@shared/types';
import { settingsClient } from '../../services/ipc';

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

function applyThemeOverrides(overrides: AppSettings['themeOverrides']) {
  const el = document.documentElement;

  // Reset everything first → presets / "Resetar tema" actually take effect.
  for (const k of THEME_TOKEN_KEYS) {
    el.style.removeProperty(`--${k}`);
  }
  el.style.removeProperty('font-size');

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
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const load = () => {
    void settingsClient.get().then((s) => {
      setSettings(s);
      applyDensity(s.uiDensity);
      applyThemeOverrides(s.themeOverrides);
    });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener('beefor:settings-changed', handler);
    return () => window.removeEventListener('beefor:settings-changed', handler);
  }, []);

  return <Ctx.Provider value={{ settings, reload: load }}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSettings must be used inside SettingsProvider');
  return v;
}

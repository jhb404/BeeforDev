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

function applyThemeOverrides(overrides: AppSettings['themeOverrides']) {
  const el = document.documentElement;
  if (!overrides) return;
  if (overrides.accent) el.style.setProperty('--accent', overrides.accent);
  if (overrides.accentHover) el.style.setProperty('--accent-hover', overrides.accentHover);
  if (overrides.warm) el.style.setProperty('--warm', overrides.warm);
  if (overrides.ok) el.style.setProperty('--ok', overrides.ok);
  if (overrides.err) el.style.setProperty('--err', overrides.err);
  if (overrides.radius) el.style.setProperty('--radius', overrides.radius);
  if (overrides.fontScale) el.style.setProperty('font-size', `${Number(overrides.fontScale) * 14}px`);
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

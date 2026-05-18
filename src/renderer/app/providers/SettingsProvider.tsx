import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppSettings } from '@shared/types/index';
import { useIpc } from '../../services/ipc';
import { resolvePresetTokens } from '../../features/gamification';
import { APP_EVENTS, onAppEvent } from '../events';
import { useToast } from './ToastProvider';

export const THEME_PREVIEW_DURATION_S = 15;

type SettingsCtx = {
  settings: AppSettings | null;
  reload: () => void;
  /** Active preview theme id — when set, overrides saved theme without persisting */
  previewThemeId: string | null;
  /** Name of preset being previewed (for banner/toast) */
  previewName: string | null;
  /** Seconds remaining on timed preview */
  previewSecondsLeft: number;
  /** Start timed preview. Auto-reverts after THEME_PREVIEW_DURATION_S with toast. */
  startThemePreview: (presetId: string, presetName: string) => void;
  /** Stop preview immediately, no toast. */
  stopThemePreview: () => void;
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

  // Expose preset id for CSS-scoped tweaks (e.g. glass blur on macazinha).
  if (presetId) el.dataset.themePreset = presetId;
  else delete el.dataset.themePreset;

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
  const showToast = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [previewSecondsLeft, setPreviewSecondsLeft] = useState(0);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopThemePreview = useCallback(() => {
    clearTimer();
    setPreviewSecondsLeft(0);
    setPreviewName(null);
    setPreviewThemeId(null);
  }, []);

  const startThemePreview = useCallback(
    (presetId: string, presetName: string) => {
      clearTimer();
      setPreviewThemeId(presetId);
      setPreviewName(presetName);
      setPreviewSecondsLeft(THEME_PREVIEW_DURATION_S);
      const start = Date.now();
      timerRef.current = window.setInterval(() => {
        const remaining = THEME_PREVIEW_DURATION_S - Math.floor((Date.now() - start) / 1000);
        if (remaining <= 0) {
          clearTimer();
          setPreviewSecondsLeft(0);
          setPreviewName(null);
          setPreviewThemeId(null);
          showToast({
            kind: 'ok',
            title: 'Preview encerrado',
            msg: `Desbloqueie "${presetName}" via conquista pra usar de verdade.`,
          });
        } else {
          setPreviewSecondsLeft(remaining);
        }
      }, 250);
    },
    [showToast],
  );

  useEffect(() => () => clearTimer(), []);

  const load = useCallback(() => {
    void settingsClient.get().then((s) => {
      setSettings(s);
      applyDensity(s.uiDensity);
    });
  }, [settingsClient]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = () => load();
    return onAppEvent(APP_EVENTS.SETTINGS_CHANGED, handler);
  }, [load]);

  // Preview takes priority over saved theme. Overrides skipped during preview
  // so user sees pure preset.
  useEffect(() => {
    if (!settings) return;
    if (previewThemeId) {
      applyThemeTokens(previewThemeId, undefined);
    } else {
      applyThemeTokens(settings.themePresetId, settings.themeOverrides);
    }
  }, [previewThemeId, settings]);

  // Re-apply preset when data-theme (dark/light) toggles.
  useEffect(() => {
    const root = document.documentElement;
    const obs = new MutationObserver(() => {
      if (!settings) return;
      if (previewThemeId) applyThemeTokens(previewThemeId, undefined);
      else applyThemeTokens(settings.themePresetId, settings.themeOverrides);
    });
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, [settings, previewThemeId]);

  return (
    <Ctx.Provider
      value={{
        settings,
        reload: load,
        previewThemeId,
        previewName,
        previewSecondsLeft,
        startThemePreview,
        stopThemePreview,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSettings(): SettingsCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSettings must be used inside SettingsProvider');
  return v;
}

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'beefor-last-seen-version';

/**
 * Mostra badge no btn do jornal quando user ainda não viu mudanças da versão atual.
 *
 * Logic:
 * - Lê `__APP_VERSION__` (injetado pelo Vite a partir do package.json)
 * - Compara com versão salva em localStorage
 * - Se diferente OU nunca salva → badge visível
 * - `markAsSeen()` salva a versão atual e remove badge
 *
 * Sinaliza também quando o updater pega update novo (event listener).
 */
declare const __APP_VERSION__: string;

function currentVersion(): string {
  try {
    return typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export function useJournalBadge() {
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    const lastSeen = window.localStorage.getItem(STORAGE_KEY);
    if (lastSeen !== currentVersion()) {
      setShowBadge(true);
    }
  }, []);

  // Also trigger badge when an update gets downloaded (so user knows: new version available)
  useEffect(() => {
    const handler = () => setShowBadge(true);
    window.addEventListener('beefor:update-downloaded', handler);
    return () => window.removeEventListener('beefor:update-downloaded', handler);
  }, []);

  const markAsSeen = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, currentVersion());
    setShowBadge(false);
  }, []);

  return { showBadge, markAsSeen };
}

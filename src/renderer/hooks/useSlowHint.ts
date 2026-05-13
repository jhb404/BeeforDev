import { useEffect, useState } from 'react';

const SLOW_HINTS = ['🐌 As vezes demora mesmo...vai tomar uma agua!'];

/**
 * Returns a hint string after `loading` stays true for `delayMs`.
 * Picks a random message once per slow event.
 */
export function useSlowHint(loading: boolean, delayMs = 12_000): string | null {
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      setHint(null);
      return;
    }
    const t = setTimeout(() => {
      const pick = SLOW_HINTS[Math.floor(Math.random() * SLOW_HINTS.length)];
      setHint(pick);
    }, delayMs);
    return () => clearTimeout(t);
  }, [loading, delayMs]);

  return hint;
}

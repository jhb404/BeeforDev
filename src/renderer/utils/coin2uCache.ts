import type { Coin2uDashboard, Coin2uTransaction } from '../../shared/types';

const CACHE_KEY = 'beefor-coin2u-cache-v1';

export interface Coin2uCache {
  dashboard: Coin2uDashboard | null;
  log: Coin2uTransaction[];
  updatedAt: string | null;
  lastSeenSignature: string | null;
}

const EMPTY_CACHE: Coin2uCache = {
  dashboard: null,
  log: [],
  updatedAt: null,
  lastSeenSignature: null,
};

export function transactionSignature(log: Coin2uTransaction[]): string {
  if (log.length === 0) return 'empty';
  const latestId = Math.max(...log.map((t) => t.TransactionId || 0));
  return `${log.length}:${latestId}`;
}

export function loadCoin2uCache(): Coin2uCache {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return EMPTY_CACHE;
    const parsed = JSON.parse(raw) as Partial<Coin2uCache>;
    return {
      dashboard: parsed.dashboard ?? null,
      log: Array.isArray(parsed.log) ? parsed.log : [],
      updatedAt: parsed.updatedAt ?? null,
      lastSeenSignature: parsed.lastSeenSignature ?? null,
    };
  } catch {
    return EMPTY_CACHE;
  }
}

export function saveCoin2uCache(cache: Coin2uCache): void {
  try {
    const trimmed = {
      ...cache,
      log: cache.log.slice(0, 250),
    };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore cache quota/private mode */
  }
}

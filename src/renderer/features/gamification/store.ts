import { DEFAULT_STATS, MOCK_STATS, type UserStats } from './types';

const STORAGE_KEY = 'beefor-gamification-v1';

/**
 * TODO: substituir por IPC para backend quando disponível.
 *
 * Por enquanto:
 * - Mock mode (default): retorna `MOCK_STATS` para demo
 * - Persisted mode: usa localStorage
 *
 * Trocar via `setUseMock(false)` no console pra testar persistência real.
 */
const USE_MOCK = true;

export function loadStats(): UserStats {
  if (USE_MOCK) return MOCK_STATS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw) as Partial<UserStats>;
    return { ...DEFAULT_STATS, ...parsed };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveStats(stats: UserStats): void {
  if (USE_MOCK) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function isBackendReady(): boolean {
  return !USE_MOCK;
}

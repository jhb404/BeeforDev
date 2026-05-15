import type { Page } from 'playwright';
import { logger } from './logger';

interface BeeforTokenEntry {
  token: string;
  idPessoa: string;
  cachedAt: number;
}

let cache: BeeforTokenEntry | null = null;

const TTL_MS = 25 * 60 * 1000; // 25 min — JWT expiry headroom

export function getBeeforTokenCache(): BeeforTokenEntry | null {
  if (!cache) return null;
  if (Date.now() - cache.cachedAt > TTL_MS) {
    cache = null;
    return null;
  }
  return cache;
}

export function invalidateBeeforTokenCache(): void {
  cache = null;
}

export async function refreshBeeforTokenCache(page: Page): Promise<BeeforTokenEntry | null> {
  try {
    const entry = await page.evaluate(() => {
      try {
        const raw = (globalThis as any).localStorage?.getItem('user1');
        if (!raw) return null;
        const data = JSON.parse(raw);
        const token = data?.token;
        const idPessoa = data?.idPessoa ?? data?.pessoa?.idPessoa ?? data?.user?.idPessoa ?? null;
        if (!token || !idPessoa) return null;
        return { token: String(token), idPessoa: String(idPessoa) };
      } catch {
        return null;
      }
    });
    if (!entry) return null;
    cache = { ...entry, cachedAt: Date.now() };
    return cache;
  } catch (err) {
    logger.warn(
      `beeforTokenCache refresh failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }
}

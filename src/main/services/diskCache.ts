import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { logger } from '../logger';

/**
 * Cache persistente em disco (userData). Padrão stale-while-revalidate:
 * - serve valor salvo na hora (mesmo velho)
 * - revalida em background; atualiza disco só se mudou
 *
 * Sem TTL de expiração: cache nunca "morre", só fica stale e é revalidado.
 */

interface CacheFile<T> {
  version: number;
  updatedAt: number;
  data: T;
}

const CACHE_VERSION = 1;

function cachePath(key: string): string {
  const safe = key.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(app.getPath('userData'), `cache-${safe}.json`);
}

export async function readDiskCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(cachePath(key), 'utf-8');
    const parsed = JSON.parse(raw) as CacheFile<T>;
    if (parsed?.version !== CACHE_VERSION) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export async function writeDiskCache<T>(key: string, data: T): Promise<void> {
  try {
    const payload: CacheFile<T> = { version: CACHE_VERSION, updatedAt: Date.now(), data };
    await fs.writeFile(cachePath(key), JSON.stringify(payload), 'utf-8');
  } catch (err) {
    logger.warn(
      `diskCache write falhou (${key}): ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export async function clearDiskCache(key: string): Promise<void> {
  try {
    await fs.unlink(cachePath(key));
  } catch {
    /* noop */
  }
}

/**
 * Memória + disco, com revalidação. Mantém valor em RAM pra acesso síncrono rápido.
 */
export class PersistentCache<T> {
  private mem: T | null = null;
  private inflight: Promise<T> | null = null;
  private loaded = false;

  constructor(
    private key: string,
    private fetcher: () => Promise<T>,
    private equals: (a: T, b: T) => boolean = (a, b) =>
      JSON.stringify(a) === JSON.stringify(b),
  ) {}

  /** Carrega disco→mem 1x (lazy). */
  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    const disk = await readDiskCache<T>(this.key);
    if (disk !== null) this.mem = disk;
    this.loaded = true;
  }

  /** Valor atual (mem se houver; senão disco; senão fetch). */
  async get(): Promise<T> {
    await this.ensureLoaded();
    if (this.mem !== null) return this.mem;
    return this.revalidate();
  }

  /** Força fetch + diff + persiste se mudou. Retorna valor novo. */
  async revalidate(): Promise<T> {
    if (this.inflight) return this.inflight;
    this.inflight = (async () => {
      try {
        const fresh = await this.fetcher();
        const changed = this.mem === null || !this.equals(this.mem, fresh);
        if (changed) {
          this.mem = fresh;
          await writeDiskCache(this.key, fresh);
          logger.info(`cache "${this.key}" atualizado (diff detectado).`);
        }
        return fresh;
      } finally {
        this.inflight = null;
      }
    })();
    return this.inflight;
  }

  /**
   * Stale-while-revalidate: retorna valor cacheado IMEDIATO (disco/mem),
   * dispara revalidação em background (não espera).
   */
  async getStaleWhileRevalidate(): Promise<T> {
    await this.ensureLoaded();
    if (this.mem !== null) {
      // background revalidate, não bloqueia
      void this.revalidate().catch(() => null);
      return this.mem;
    }
    // sem cache → primeira vez precisa esperar
    return this.revalidate();
  }

  /** Limpa mem + disco. */
  async clear(): Promise<void> {
    this.mem = null;
    this.loaded = false;
    await clearDiskCache(this.key);
  }

  /** Acesso síncrono ao valor em memória (null se não carregado). */
  peek(): T | null {
    return this.mem;
  }
}

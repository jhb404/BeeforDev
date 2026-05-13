import type { ActionResult } from '../../shared/types';

export function ok<T>(data?: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: unknown): ActionResult {
  const msg = error instanceof Error ? error.message : String(error);
  return { ok: false, error: msg };
}

export function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) =>
      setTimeout(() => rej(new Error(`${label}: timeout após ${ms}ms`)), ms),
    ),
  ]);
}

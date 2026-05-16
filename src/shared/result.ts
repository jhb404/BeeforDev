import type { ActionResult } from './types/common';

export function ok(): ActionResult<void>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T> {
  return { ok: true, data: data as T extends void ? undefined : T };
}

export function fail(error: unknown): ActionResult<never> {
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

/** Extract error string from any ActionResult. Returns '' when ok. */
export function getError(res: ActionResult<unknown>): string {
  return res.ok ? '' : res.error;
}

/** Type guard — narrows to error variant */
export function isErr<T>(res: ActionResult<T>): res is { ok: false; error: string } {
  return !res.ok;
}

/** Type guard — narrows to ok variant */
export function isOk<T>(
  res: ActionResult<T>,
): res is { ok: true; data: T extends void ? undefined : T } {
  return res.ok;
}

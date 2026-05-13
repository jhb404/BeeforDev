import type { ActionResult } from './types';

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

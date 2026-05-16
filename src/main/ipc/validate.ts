import type { z } from 'zod';
import { logger } from '../logger';
import { fail } from '../../shared/result';
import type { ActionResult } from '../../shared/types/index';

/**
 * Validates IPC payload against a zod schema.
 * On failure, logs a redacted summary and returns an ActionResult for handler short-circuit.
 *
 * Use in handler bodies:
 *   const parsed = validate(schema, payload);
 *   if (!parsed.ok) return parsed.result;
 *   const safe = parsed.data;
 */
export type ValidationOutcome<T> = { ok: true; data: T } | { ok: false; result: ActionResult };

export function validate<S extends z.ZodTypeAny>(
  schema: S,
  payload: unknown,
): ValidationOutcome<z.infer<S>> {
  const r = schema.safeParse(payload);
  if (r.success) return { ok: true, data: r.data };
  const summary = r.error.issues
    .slice(0, 3)
    .map((i) => `${i.path.join('.') || '<root>'}: ${i.code}`)
    .join('; ');
  logger.warn(`IPC validation rejected: ${summary}`);
  return { ok: false, result: fail(new Error('Payload inválido')) };
}

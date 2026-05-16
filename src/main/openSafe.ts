import { shell } from 'electron';
import { logger } from './logger';

const ALLOWED_PROTOCOLS = new Set(['https:', 'mailto:']);

/**
 * Validates a URL before handing it to shell.openExternal.
 *
 * Why: shell.openExternal is a known foot-gun. A renderer that smuggles a
 * `file:` or custom-scheme URL through here can trigger local code execution
 * via the OS handler. Restricting to https + mailto removes that vector while
 * keeping every legitimate use we have (Beefor/Coin2U links, contact links).
 */
export async function openExternalSafe(rawUrl: string): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    logger.warn(`openExternalSafe: rejected malformed URL`);
    return false;
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    logger.warn(`openExternalSafe: rejected protocol "${parsed.protocol}"`);
    return false;
  }
  try {
    await shell.openExternal(parsed.toString());
    return true;
  } catch (err) {
    logger.warn(
      `openExternalSafe: shell.openExternal failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    return false;
  }
}

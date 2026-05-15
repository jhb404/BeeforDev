import log from 'electron-log/main';
import type { BrowserWindow } from 'electron';

log.initialize();
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// kept for backwards compat with existing call sites; no longer streams to renderer
export function bindLoggerWindow(_win: BrowserWindow) {
  /* no-op */
}

/**
 * Strips PII from log lines before they hit disk or console:
 *  - emails → <email>
 *  - password/token-shaped key/value pairs → <redacted>
 *  - long bearer-style tokens → <token>
 */
function redact(input: string): string {
  return input
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '<email>')
    .replace(
      /(["']?(?:password|senha|token|tokenApi|TokenApi|apitoken|authorization|secret)["']?\s*[:=]\s*)["']?[^"',\s}]+["']?/gi,
      '$1<redacted>',
    )
    .replace(/\bBearer\s+[A-Za-z0-9._-]{16,}\b/g, 'Bearer <token>');
}

export const logger = {
  info(message: string) {
    log.info(redact(message));
  },
  warn(message: string) {
    log.warn(redact(message));
  },
  error(message: string, err?: unknown) {
    const full = err ? `${message} :: ${formatErr(err)}` : message;
    log.error(redact(full));
  },
  debug(message: string) {
    log.debug(redact(message));
  },
};

function formatErr(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

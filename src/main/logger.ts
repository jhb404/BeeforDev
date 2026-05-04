import log from 'electron-log/main';
import type { BrowserWindow } from 'electron';

log.initialize();
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// kept for backwards compat with existing call sites; no longer streams to renderer
export function bindLoggerWindow(_win: BrowserWindow) {
  /* no-op */
}

export const logger = {
  info(message: string) {
    log.info(message);
  },
  warn(message: string) {
    log.warn(message);
  },
  error(message: string, err?: unknown) {
    const full = err ? `${message} :: ${formatErr(err)}` : message;
    log.error(full);
  },
  debug(message: string) {
    log.debug(message);
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

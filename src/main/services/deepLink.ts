import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { logger } from '../logger';

/**
 * Deep link beefor:// — abrir o app a partir de um link de convite.
 *
 * Formato do convite de poker:
 *   beefor://join?ws=<wsUrlEncoded>&room=<CODE>
 *
 * Fluxo:
 *  - Windows/Linux: o SO reabre o app passando a URL como argv → captamos no
 *    second-instance / no argv inicial.
 *  - macOS: evento 'open-url'.
 *  - Guardamos a última URL pendente até o renderer estar pronto e pedir
 *    (canal IPC 'deeplink:consume'), aí mandamos pra ele.
 */

const PROTOCOL = 'beefor';
let pendingUrl: string | null = null;

/** Registra o app como handler do esquema beefor:// no SO. */
export function registerDeepLink(): void {
  if (process.defaultApp && process.argv.length >= 2) {
    // dev: electron.exe precisa do caminho do script pra reabrir corretamente
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }
}

/** Extrai uma URL beefor:// de uma lista de argumentos (Windows/Linux). */
export function extractUrlFromArgv(argv: string[]): string | null {
  return argv.find((a) => a.startsWith(`${PROTOCOL}://`)) ?? null;
}

/** Guarda a URL e tenta entregar agora se houver janela pronta. */
export function handleDeepLinkUrl(url: string | null, win: BrowserWindow | null): void {
  if (!url) return;
  pendingUrl = url;
  logger.info(`[deeplink] recebido: ${url}`);
  deliver(win);
}

/** Manda a URL pendente pro renderer (se houver janela e URL). */
export function deliver(win: BrowserWindow | null): void {
  if (!pendingUrl || !win || win.isDestroyed()) return;
  const url = pendingUrl;
  pendingUrl = null;
  win.webContents.send('deeplink:url', url);
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

/** O renderer pede a URL pendente ao montar (caso tenha chegado antes dele). */
export function consumePendingUrl(): string | null {
  const url = pendingUrl;
  pendingUrl = null;
  return url;
}

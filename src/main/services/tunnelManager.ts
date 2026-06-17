import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { logger } from '../logger';
import { getPokerPort } from './pokerServer';

/**
 * Gerencia um Cloudflare Quick Tunnel (trycloudflare.com) para expor o
 * servidor WS local de poker à internet — sem conta, sem login.
 *
 * O host clica "Criar sala": subimos o cloudflared apontando para
 * http://localhost:<porta-do-poker> e capturamos a URL pública gerada.
 * O convite usa essa URL (wss://<random>.trycloudflare.com).
 *
 * Só Windows por enquanto (binário cloudflared.exe empacotado em resources/).
 */

let proc: ChildProcess | null = null;
let publicUrl: string | null = null;

/** Caminho do binário: packaged → resources/, dev → resources/ do projeto. */
function cloudflaredPath(): string {
  const candidates = app.isPackaged
    ? [path.join(process.resourcesPath, 'cloudflared.exe')]
    : [
        path.join(app.getAppPath(), 'resources', 'cloudflared.exe'),
        path.join(__dirname, '../../resources/cloudflared.exe'),
      ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('cloudflared.exe não encontrado. Rode: node scripts/fetch-cloudflared.mjs');
}

/**
 * Sobe o túnel e resolve com a URL pública (https://...trycloudflare.com).
 * Idempotente: se já houver túnel ativo, retorna a URL existente.
 */
export function startTunnel(): Promise<string> {
  if (publicUrl) return Promise.resolve(publicUrl);

  return new Promise((resolve, reject) => {
    let bin: string;
    try {
      bin = cloudflaredPath();
    } catch (err) {
      return reject(err);
    }

    const port = getPokerPort();
    proc = spawn(bin, ['tunnel', '--url', `http://localhost:${port}`, '--no-autoupdate']);

    let settled = false;
    const urlRe = /(https:\/\/[a-z0-9-]+\.trycloudflare\.com)/i;

    const onData = (buf: Buffer) => {
      const text = buf.toString();
      const m = text.match(urlRe);
      if (m && !settled) {
        settled = true;
        publicUrl = m[1];
        logger.info(`[tunnel] URL pública: ${publicUrl}`);
        resolve(publicUrl);
      }
    };

    // cloudflared escreve a URL no stderr.
    proc.stdout?.on('data', onData);
    proc.stderr?.on('data', onData);

    proc.on('error', (err) => {
      logger.error('[tunnel] falha ao iniciar cloudflared', err);
      if (!settled) {
        settled = true;
        reject(err);
      }
    });

    proc.on('exit', (code) => {
      logger.info(`[tunnel] cloudflared encerrou (code ${code})`);
      proc = null;
      publicUrl = null;
      if (!settled) {
        settled = true;
        reject(new Error('cloudflared encerrou antes de gerar URL'));
      }
    });

    // Timeout de segurança — túnel costuma subir em <10s.
    setTimeout(() => {
      if (!settled) {
        settled = true;
        stopTunnel();
        reject(new Error('Timeout ao abrir túnel (30s)'));
      }
    }, 30_000);
  });
}

/** Derruba o túnel (host clicou "Encerrar sala" ou fechou o app). */
export function stopTunnel(): void {
  if (proc) {
    try {
      proc.kill();
    } catch (err) {
      logger.warn('[tunnel] erro ao matar cloudflared', err);
    }
  }
  proc = null;
  publicUrl = null;
}

export function getTunnelUrl(): string | null {
  return publicUrl;
}

import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import https from 'node:https';
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
 * Binário empacotado em resources/ por plataforma:
 *   Windows → cloudflared.exe   macOS → cloudflared-darwin   Linux → cloudflared-linux
 * (rode `node scripts/fetch-cloudflared.mjs` na plataforma alvo).
 */

let proc: ChildProcess | null = null;
let publicUrl: string | null = null;

/** Nome do binário conforme o SO atual. */
function binName(): string {
  if (process.platform === 'win32') return 'cloudflared.exe';
  if (process.platform === 'darwin') return 'cloudflared-darwin';
  return 'cloudflared-linux';
}

/** Caminho do binário: packaged → resources/, dev → resources/ do projeto. */
function cloudflaredPath(): string {
  const name = binName();
  const candidates = app.isPackaged
    ? [path.join(process.resourcesPath, name)]
    : [
        path.join(app.getAppPath(), 'resources', name),
        path.join(__dirname, `../../resources/${name}`),
      ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(`${name} não encontrado. Rode: node scripts/fetch-cloudflared.mjs`);
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
        // Probe de alcance em background — só pra logar; não bloqueia o host.
        // O host conecta via ws://localhost, então não depende desse DNS.
        // Convidados podem precisar esperar a propagação ao clicar no convite.
        probeReachability(publicUrl).catch(() => {
          /* log apenas — não interrompe */
        });
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

    // Timeout de segurança — só dispara se a URL nunca aparecer no log.
    // A espera de propagação tem seu próprio timeout em waitUntilReachable.
    setTimeout(() => {
      if (!settled) {
        settled = true;
        stopTunnel();
        reject(new Error('Timeout ao abrir túnel (30s sem URL no log)'));
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
      logger.warn(
        `[tunnel] erro ao matar cloudflared: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
  proc = null;
  publicUrl = null;
}

export function getTunnelUrl(): string | null {
  return publicUrl;
}

/**
 * Probe não bloqueante — só registra no log quando o edge da Cloudflare passa a
 * responder. Útil pra diagnóstico: se o host vê "tunnel pronto", convidados conseguem
 * conectar. Se nunca passa, provavelmente é DNS local ruim pra *.trycloudflare.com.
 */
function probeReachability(url: string, totalTimeoutMs = 60_000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    let lastErr: Error | null = null;

    const probe = () => {
      const req = https.request(url, { method: 'GET', timeout: 4000 }, (res) => {
        res.resume();
        logger.info(`[tunnel] edge respondeu (${res.statusCode}) — convidados podem entrar`);
        resolve();
      });
      req.on('timeout', () => req.destroy(new Error('probe timeout')));
      req.on('error', (err) => {
        lastErr = err as Error;
        if (Date.now() - start >= totalTimeoutMs) {
          logger.warn(
            `[tunnel] edge ainda não respondeu após ${totalTimeoutMs}ms (${lastErr.message}). ` +
              `DNS local pode estar lento pra resolver *.trycloudflare.com — convidados ` +
              `precisarão esperar a propagação ao clicar no convite.`,
          );
          reject(lastErr);
          return;
        }
        setTimeout(probe, 1500);
      });
      req.end();
    };

    probe();
  });
}

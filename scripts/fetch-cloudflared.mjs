#!/usr/bin/env node
/*
 * Baixa o binário cloudflared para resources/ conforme a plataforma:
 *   Windows → cloudflared.exe
 *   macOS   → cloudflared-darwin (universal/arm64/amd64 conforme a máquina)
 *   Linux   → cloudflared-linux
 * Usado pelo Planning Poker para abrir um quick tunnel (trycloudflare.com)
 * e expor o servidor WS local à internet sem o usuário instalar nada.
 *
 * Rodar manualmente: node scripts/fetch-cloudflared.mjs
 * Para baixar de outra plataforma (build cross): TARGET=darwin node scripts/...
 */
import { createWriteStream, existsSync, mkdirSync, chmodSync, renameSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import https from 'node:https';
import os from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://github.com/cloudflare/cloudflared/releases/latest/download';

const target = process.env.TARGET || process.platform; // win32 | darwin | linux
const arch = os.arch(); // 'x64' | 'arm64'

/** { destino, url, executável? } por plataforma. */
function spec() {
  if (target === 'win32') {
    return {
      file: 'cloudflared.exe',
      url: `${BASE}/cloudflared-windows-amd64.exe`,
      exec: false,
    };
  }
  if (target === 'darwin') {
    // releases macOS vêm em .tgz; usamos o amd64 (roda em arm64 via Rosetta).
    // Se quiser arm64 nativo, troque por cloudflared-darwin-arm64.tgz e descompacte.
    return {
      file: 'cloudflared-darwin',
      url: `${BASE}/cloudflared-${arch === 'arm64' ? 'darwin-arm64' : 'darwin-amd64'}.tgz`,
      exec: true,
      tgz: true,
    };
  }
  // linux
  return {
    file: 'cloudflared-linux',
    url: `${BASE}/cloudflared-linux-${arch === 'arm64' ? 'arm64' : 'amd64'}`,
    exec: true,
  };
}

const { file, url, exec, tgz } = spec();
const dest = resolve(__dirname, '../resources', file);

if (existsSync(dest)) {
  console.log(`${file} já existe, pulando download.`);
  process.exit(0);
}

mkdirSync(dirname(dest), { recursive: true });

function finalize(fileOut) {
  if (exec) {
    try {
      chmodSync(fileOut, 0o755);
    } catch {
      /* chmod falha no Windows — ok */
    }
  }
  console.log(`${file} pronto em resources/${file}.`);
}

function extractTgz(tgzPath) {
  const extractDir = resolve(tmpdir(), `cloudflared-extract-${Date.now()}`);
  mkdirSync(extractDir, { recursive: true });
  const res = spawnSync('tar', ['-xzf', tgzPath, '-C', extractDir], { stdio: 'inherit' });
  if (res.status !== 0) {
    throw new Error(`tar -xzf falhou (status ${res.status}). Extraia ${tgzPath} manualmente.`);
  }
  const extractedBin = resolve(extractDir, 'cloudflared');
  if (!existsSync(extractedBin)) {
    throw new Error(`Binário "cloudflared" não encontrado após extração em ${extractDir}.`);
  }
  renameSync(extractedBin, dest);
  rmSync(extractDir, { recursive: true, force: true });
  rmSync(tgzPath, { force: true });
  finalize(dest);
}

function download(downloadUrl, fileOut, redirects = 0) {
  if (redirects > 5) throw new Error('Excesso de redirects');
  https
    .get(downloadUrl, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return download(res.headers.location, fileOut, redirects + 1);
      }
      if (res.statusCode !== 200) {
        throw new Error(`Download falhou: HTTP ${res.statusCode}`);
      }
      const out = createWriteStream(fileOut);
      res.pipe(out);
      out.on('finish', () =>
        out.close(() => {
          if (tgz) {
            try {
              extractTgz(fileOut);
            } catch (err) {
              console.error('Erro ao extrair .tgz:', err.message);
              process.exit(1);
            }
            return;
          }
          finalize(fileOut);
        }),
      );
    })
    .on('error', (err) => {
      console.error('Erro no download:', err.message);
      process.exit(1);
    });
}

const downloadTarget = tgz ? resolve(tmpdir(), `cloudflared-${Date.now()}.tgz`) : dest;
download(url, downloadTarget);

#!/usr/bin/env node
/*
 * Baixa o binário cloudflared (Windows) para resources/cloudflared.exe.
 * Usado pelo Planning Poker para abrir um quick tunnel (trycloudflare.com)
 * e expor o servidor WS local à internet sem o usuário instalar nada.
 *
 * Rodar manualmente: node scripts/fetch-cloudflared.mjs
 */
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dest = resolve(__dirname, '../resources/cloudflared.exe');
const URL =
  'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe';

if (existsSync(dest)) {
  console.log('cloudflared.exe já existe, pulando download.');
  process.exit(0);
}

mkdirSync(dirname(dest), { recursive: true });

function download(url, file, redirects = 0) {
  if (redirects > 5) throw new Error('Excesso de redirects');
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.resume();
      return download(res.headers.location, file, redirects + 1);
    }
    if (res.statusCode !== 200) {
      throw new Error(`Download falhou: HTTP ${res.statusCode}`);
    }
    const out = createWriteStream(file);
    res.pipe(out);
    out.on('finish', () => out.close(() => console.log('cloudflared.exe baixado.')));
  }).on('error', (err) => {
    console.error('Erro no download:', err.message);
    process.exit(1);
  });
}

download(URL, dest);

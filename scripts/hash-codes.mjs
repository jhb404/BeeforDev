#!/usr/bin/env node
/**
 * Gera SHA-256 hex de cada código declarado em `codes.private.md`.
 *
 * USO:
 *   1. Editar `codes.private.md` na raiz (formato abaixo)
 *   2. Rodar `node scripts/hash-codes.mjs`
 *   3. Copiar bloco gerado e colar em `src/renderer/features/gamification/unlockCodes.ts`
 *   4. NUNCA commitar `codes.private.md` (já no .gitignore)
 *
 * FORMATO de `codes.private.md`:
 *
 *   ## Themes
 *   ocean = maresia-2026
 *   forest = beefor-trees-77
 *   inferno = phoenix-flame-99
 *
 *   ## Icons
 *   flame = bird-of-fire-2026
 *   crowned = queen-bee-55
 *
 * Comentários (#) ignorados. Linhas vazias ignoradas.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FILE = resolve(process.cwd(), 'codes.private.md');

if (!existsSync(FILE)) {
  console.error(`❌ Arquivo não encontrado: ${FILE}`);
  console.error('   Cria ele com o formato:');
  console.error('   ## Themes');
  console.error('   ocean = meu-codigo-secreto');
  console.error('   ## Icons');
  console.error('   flame = outro-codigo');
  process.exit(1);
}

const raw = readFileSync(FILE, 'utf-8');

const themes = {};
const icons = {};
let section = null;

for (const lineRaw of raw.split(/\r?\n/)) {
  const line = lineRaw.trim();
  if (!line || line.startsWith('#') && !line.startsWith('##')) continue;
  if (line.startsWith('##')) {
    const name = line.replace(/^##+\s*/, '').toLowerCase();
    if (name.startsWith('theme')) section = themes;
    else if (name.startsWith('icon')) section = icons;
    else section = null;
    continue;
  }
  if (!section) continue;
  const eq = line.indexOf('=');
  if (eq < 0) continue;
  const id = line.slice(0, eq).trim();
  const code = line.slice(eq + 1).trim();
  if (!id || !code) continue;
  const hash = createHash('sha256').update(code.trim().toLowerCase()).digest('hex');
  section[id] = hash;
}

function emit(label, obj) {
  console.log(`\n// ===== ${label} =====`);
  if (Object.keys(obj).length === 0) {
    console.log('// (vazio — adiciona códigos em codes.private.md)');
    return;
  }
  for (const [id, hash] of Object.entries(obj)) {
    console.log(`  ${id}: '${hash}',`);
  }
}

console.log('🐝 Hashes gerados — cola em src/renderer/features/gamification/unlockCodes.ts:');
emit('THEME_UNLOCK_HASHES', themes);
emit('ICON_UNLOCK_HASHES', icons);
console.log(`\n✅ Total: ${Object.keys(themes).length} temas, ${Object.keys(icons).length} ícones.`);

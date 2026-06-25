#!/usr/bin/env node
/*
 * Copia os recortes de poker (resources/poker/new/out/*.png) para
 * src/renderer/public/poker/ — onde o app realmente carrega as imagens.
 *
 * Rode sempre que editar/atualizar os PNG dos personagens, mesa ou cartas:
 *   node scripts/sync-poker-art.mjs
 *
 * Depois, lembre de bumpar ART_VERSION em
 * src/renderer/features/poker/cardTier.ts pra furar o cache do app.
 */
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, '../resources/poker/new/out');
const dest = resolve(__dirname, '../src/renderer/public/poker');

mkdirSync(dest, { recursive: true });

const pngs = readdirSync(src).filter((f) => f.endsWith('.png') && !f.startsWith('check'));
for (const f of pngs) {
  copyFileSync(join(src, f), join(dest, f));
}
console.log(`✅ ${pngs.length} imagens copiadas para public/poker/`);
console.log('⚠️  Bumpe ART_VERSION em src/renderer/features/poker/cardTier.ts pra furar o cache.');

/**
 * Códigos de desbloqueio manual de temas/ícones.
 *
 * SEGURANÇA:
 * - Só guardamos HASH SHA-256 do código (visível no git/asar mas inútil sozinho)
 * - Código real fica em `codes.private.md` (gitignored) — fonte da verdade do JB
 * - Pra adicionar/trocar: editar `codes.private.md`, rodar `node scripts/hash-codes.mjs`,
 *   colar os hashes gerados aqui embaixo, commitar SÓ os hashes
 * - Brute-force resistir: códigos não-óbvios + 16+ chars
 *
 * QUANDO BACKEND CHEGAR: substituir hash table por POST /redeem.
 */

import type { ThemePreset, IconVariant } from './types';
import { APP_EVENTS, emitAppEvent } from '../../app/events';

/** SHA-256 hex do código secreto. Gerado pelo script `scripts/hash-codes.mjs`. */
type CodeHash = string;

/**
 * Mapa: themePresetId → hash do código.
 * `null` = sem código distribuível (default/sempre disponível).
 *
 * Pra adicionar/trocar: edita `codes.private.md`, roda script, cola hashes aqui.
 */
const THEME_UNLOCK_HASHES: Partial<Record<string, CodeHash>> = {
  ocean: 'fdcff17cf2a748444c06411086e2eb2185145e8a2312d851f3528ff0ea292fd2',
  forest: 'e9dbe940179738595a3de8412ac757c6271bb50f9fcf9a338e2412ebb07489ff',
  sakura: '59ae856cd788d0f57e39fdd66d421ba930cd89be4682de3aa36c22a2021a710d',
  mint: 'eb17aa642b45007b076c6a0f7721116d0fca2f97627e204817e0b6234b68c68c',
  lavender: 'eaa2bded32cc585d3f37c5319abe8890ad28a697ed66d5823f10536cc9c0fdb9',
  sunset: 'e95bceb94656714fb054912659811595f211fc8ea5ae4df42e8d70c8c621e4e7',
  inferno: '636da386006679f9805d3ee695340711565a19b31f00bf95805238d9230d1b1e',
  royal: '45d7e2022136c57af08c0e2b89e4f73dc01e673fa5bdeb0677362ae687dd0364',
  gold: '8d2ac8b58ead9744d77286de9b0bcb7a894f238c3149fc9f3b1e3caff36330fe',
  galaxy: 'a4de68667b226ba0387d81b6db6f78e8279fe40182cd82cae2f6a16173185964',
  diamond: '2a321c60cd2c00b288b96abc8bb5aa420a7d0520fd73c0482d23c2bf0caa3bff',
  cyber: '3d9da0471c648d3cc834e068ae09d5043a70ea06795b50f478f0a8fa84e75a31',
  mocha: 'f19c46223a284d56460da7415e260919b1dcadaff241d79833ab25be9096c9d3',
  master: 'da946be4f86ed926f534879e16ab6a9b986d696fe2ff78444f4363cb631c7680',
};

const ICON_UNLOCK_HASHES: Partial<Record<string, CodeHash>> = {
  flame: '5b15481549de6ac2942d8b1304a72a19a53f53a5a0765dd567d56655699d0f6b',
  crowned: 'ed0b6d4474ea1bb6b291cfc7e03d96b3ade879ddd1d96f96cc8db2218696fb3c',
  trophy: '9a5e4b4fe34eab5993e341a22c1722007096699d12274d31ff70aa3f40edeea5',
  galaxy: '0d57a2df7ca67113b1f705bff8e981f1b76f65dc38da2e1bfa58c2d8d9816981',
  diamond: 'f7a6487cc249674ba62d46bf9549c570f8b17c2d780fd052765109cd0018da64',
  master: '34b9f66635d747521d9a43ef51c7c9911319d4d10bf98c20c9fb61a1b9f96e55',
};

/** Type guard pra silenciar TS quando os mapas estão vazios */
function _useTypeImports(): [ThemePreset, IconVariant] | null {
  return null;
}
void _useTypeImports;

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input.trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function validateThemeCode(themeId: string, code: string): Promise<boolean> {
  const expected = THEME_UNLOCK_HASHES[themeId];
  if (!expected) return false;
  const actual = await sha256Hex(code);
  return actual === expected;
}

export async function validateIconCode(iconId: string, code: string): Promise<boolean> {
  const expected = ICON_UNLOCK_HASHES[iconId];
  if (!expected) return false;
  const actual = await sha256Hex(code);
  return actual === expected;
}

/**
 * Storage helpers — persiste IDs desbloqueados no localStorage.
 * Quando backend chegar, mover pra IPC/server.
 */
const STORAGE_KEY = 'beefor-redeemed-codes-v1';

interface RedeemedCodes {
  themes: string[];
  icons: string[];
}

function load(): RedeemedCodes {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { themes: [], icons: [] };
    const parsed = JSON.parse(raw) as Partial<RedeemedCodes>;
    return {
      themes: Array.isArray(parsed.themes) ? parsed.themes : [],
      icons: Array.isArray(parsed.icons) ? parsed.icons : [],
    };
  } catch {
    return { themes: [], icons: [] };
  }
}

function save(data: RedeemedCodes): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota — ignore */
  }
}

export function getRedeemedThemes(): string[] {
  return load().themes;
}

export function getRedeemedIcons(): string[] {
  return load().icons;
}

export function redeemTheme(themeId: string): void {
  const data = load();
  if (!data.themes.includes(themeId)) {
    data.themes.push(themeId);
    save(data);
    emitAppEvent(APP_EVENTS.CODES_CHANGED);
  }
}

export function redeemIcon(iconId: string): void {
  const data = load();
  if (!data.icons.includes(iconId)) {
    data.icons.push(iconId);
    save(data);
    emitAppEvent(APP_EVENTS.CODES_CHANGED);
  }
}

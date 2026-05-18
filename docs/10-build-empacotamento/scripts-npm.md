# Scripts NPM

> **Path:** `package.json`
> **Responsabilidade em uma frase:** Listar cada script npm e seu efeito.

## Responsabilidade
Scripts controlam desenvolvimento, build, empacotamento, testes, lint e utilitarios.

## API Publica
| Script | Comando | Efeito |
|---|---|---|
| `predev` | `node scripts/free-port.mjs 5177` | Libera porta dev. |
| `dev` | `concurrently ...` | Vite + tsc watch + Electron. |
| `dev:renderer` | `vite` | Servidor renderer porta 5177. |
| `dev:tsc` | `tsc -p tsconfig.main.json -w` | Compila main em watch. |
| `dev:electron` | `wait-on ... && electron .` | Inicia Electron dev. |
| `kill:port` | `node scripts/free-port.mjs 5177` | Libera porta manualmente. |
| `codes:hash` | `node scripts/hash-codes.mjs` | Gera hashes de unlock codes. |
| `build:renderer` | `vite build` | Gera `dist/renderer`. |
| `build:main` | `tsc -p tsconfig.main.json && node scripts/build-preload.mjs` | Gera main e preload. |
| `build` | `npm run build:renderer && npm run build:main` | Build completo. |
| `start` | `electron .` | Inicia app a partir do package. |
| `package:win` | `npm run build && electron-builder --win --publish always` | Build + NSIS + publish. |
| `package:mac` | `npm run build && electron-builder --mac --publish always` | Build + DMG + publish. |
| `postinstall` | `playwright install chromium` | Instala Chromium. |
| `test` | `vitest run` | Testes. |
| `lint` | `tsc --noEmit && eslint src --max-warnings 0` | Typecheck renderer/shared + eslint. |
| `format` | `prettier --write "src/**/*.{ts,tsx}"` | Formata src. |
| `prepare` | `husky` | Hooks git. |

## Fluxo Interno
Dev depende de `dist/main/index.js` existir via tsc watch antes do Electron iniciar.

## Erros e Edge Cases
- `lint` usa `tsc --noEmit` com `tsconfig.json`, nao cobre main CommonJS da mesma forma que `build:main`.

## Side Effects
Processos dev, dist, release, install de browsers, publish releases.

## Dependencias
Node/npm e deps package.

## Consumidores
Desenvolvedores/CI.

## Testes
Ver [../11-testes/README.md](../11-testes/README.md).

## Observacoes / Dividas
Considerar script separado de typecheck main em lint.

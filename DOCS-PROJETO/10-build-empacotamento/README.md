# Build e Empacotamento

> **Path:** `package.json`, `vite.config.ts`, `tsconfig*.json`, `scripts/*`
> **Responsabilidade em uma frase:** Documentar scripts, builds renderer/main/preload e empacotamento Electron.

## Responsabilidade
Build separa renderer Vite, main TypeScript CommonJS e preload bundlado por esbuild. Empacotamento usa electron-builder.

## API Publica
| Area | Arquivo | Doc |
|---|---|---|
| Scripts npm | `package.json` | [scripts-npm.md](./scripts-npm.md) |
| Vite | `vite.config.ts` | [vite.md](./vite.md) |
| TypeScript | `tsconfig.json`, `tsconfig.main.json` | [tsconfig.md](./tsconfig.md) |
| Preload | `scripts/build-preload.mjs` | [preload-bundle.md](./preload-bundle.md) |
| Packaging | `package.json.build` | [electron-builder.md](./electron-builder.md) |

## Fluxo Interno
`npm run build` -> `build:renderer` -> `build:main` -> `tsc -p tsconfig.main.json` + preload esbuild.

## Erros e Edge Cases
- `predev` mata porta 5177 antes do dev.
- `postinstall` instala Chromium Playwright.
- Preload e excluido do `tsconfig.main.json` e buildado separadamente.

## Side Effects
`dist/`, `release/`, downloads Playwright, artefatos electron-builder.

## Dependencias
npm scripts, Vite, TypeScript, esbuild, electron-builder.

## Consumidores
Desenvolvedores e CI/local build.

## Testes
`npm run build` executado na verificacao final desta tarefa.

## Observacoes / Dividas
`package.json.version` diverge de docs base.

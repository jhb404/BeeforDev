# TSConfig

> **Path:** `tsconfig.json`, `tsconfig.main.json`
> **Responsabilidade em uma frase:** Separar typecheck renderer/shared e build main/automation/shared.

## Responsabilidade
Renderer usa ESNext/Bundler/noEmit/JSX; main usa CommonJS/Node/outDir dist/rootDir src.

## API Publica
| Arquivo | Escopo | Module | Output |
|---|---|---|---|
| `tsconfig.json` | renderer, shared, test | `ESNext`, `Bundler` | `noEmit: true` |
| `tsconfig.main.json` | main, automation, shared | `CommonJS`, `Node` | `dist` |

## Fluxo Interno
`build:main` usa `tsconfig.main.json`; `lint` usa `tsc --noEmit` default, ou seja `tsconfig.json`.

## Erros e Edge Cases
- `src/main/preload.ts` e excluido de `tsconfig.main.json` porque esbuild bundle separado produz preload.
- Aliases diferem: renderer inclui `@renderer`, main inclui `@main`.

## Side Effects
Compilacao main gera JS/source maps em `dist`.

## Dependencias
TypeScript.

## Consumidores
npm scripts, IDE.

## Testes
Build main valida config.

## Observacoes / Dividas
Lint pode nao capturar erros exclusivos do main se nao rodar `tsc -p tsconfig.main.json --noEmit`.

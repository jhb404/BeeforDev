# Preload Bundle

> **Path:** `scripts/build-preload.mjs`, `src/main/preload.ts`
> **Responsabilidade em uma frase:** Gerar preload unico compativel com sandbox Electron.

## Responsabilidade
Preload expoe `window.beefor` via `contextBridge` e precisa ser bundlado em um arquivo CJS sem imports locais em runtime.

## API Publica
| Item | Valor |
|---|---|
| Entrada | `src/main/preload.ts` |
| Saida | `dist/main/preload.js` |
| Bundler | `esbuild` |
| Platform | browser |
| External | `electron` |

## Fluxo Interno
`build:main` compila main com tsc e depois roda `node scripts/build-preload.mjs`.

## Erros e Edge Cases
- Renderer sandboxed nao pode carregar require cross-directory; bundle resolve isso.
- Preload deve expor apenas funcoes IPC serializaveis.

## Side Effects
Arquivo `dist/main/preload.js`.

## Dependencias
esbuild, electron external.

## Consumidores
`BrowserWindow.webPreferences.preload`.

## Testes
Build valida bundle; sem teste especifico.

## Observacoes / Dividas
Manter imports do preload compativeis com bundling browser.

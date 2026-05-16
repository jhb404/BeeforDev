# Vite

> **Path:** `vite.config.ts`
> **Responsabilidade em uma frase:** Buildar e servir o renderer React.

## Responsabilidade
Vite usa root `src/renderer`, plugin React, aliases e injeta `__APP_VERSION__` a partir de `package.json`.

## API Publica
| Config | Valor |
|---|---|
| `root` | `src/renderer` |
| `base` | `./` |
| `plugins` | `react()` |
| `aliases` | `@shared`, `@renderer`, `@automation` |
| `define.__APP_VERSION__` | `package.json.version` |
| `build.outDir` | `dist/renderer` |
| `server.port` | `5177` strict |

## Fluxo Interno
Dev renderer servido em localhost; prod gera arquivos estaticos carregados por `BrowserWindow.loadFile`.

## Erros e Edge Cases
- `strictPort: true` falha se 5177 ocupada; `predev` tenta liberar.

## Side Effects
`dist/renderer`.

## Dependencias
Vite, React plugin.

## Consumidores
`createMainWindow` em dev/prod.

## Testes
Build renderer validado por `npm run build`.

## Observacoes / Dividas
`__APP_VERSION__` reflete `0.1.8` do package atual.

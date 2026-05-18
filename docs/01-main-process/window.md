# Window

> **Path:** `src/main/window.ts`, `src/main/csp.ts`, `src/main/openSafe.ts`
> **Responsabilidade em uma frase:** Criar BrowserWindow segura, resolver assets e bloquear navegacao externa insegura.

## Responsabilidade
A janela principal e frameless, sandboxed, com context isolation e sem Node no renderer. Navegacoes fora de `localhost:5177` ou `file://` sao desviadas para `openExternalSafe`, que permite apenas `https:` e `mailto:`.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `getBuildAssetsDir` | function | `() => string` | Procura `build/` em resources/app paths. |
| `getBuildAssetPath` | function | `(fileName) => string` | Junta diretorio de assets com `path.basename`. |
| `getBuildIconPath` | function | `(variant?) => string` | Escolhe icone por variante e fallback. |
| `createMainWindow` | function | `(variant?) => BrowserWindow` | Configura BrowserWindow, preload, sandbox, handlers de navegacao. |
| `installCsp` | function | `(isDev) => void` | Injeta CSP via `onHeadersReceived`. |
| `openExternalSafe` | function | `(rawUrl) => Promise<boolean>` | Valida URL antes de `shell.openExternal`. |

## Fluxo Interno
```ascii
createMainWindow
  -> getBuildIconPath
  -> new BrowserWindow({ frame:false, preload, contextIsolation, nodeIntegration:false, sandbox:true })
  -> dev: loadURL localhost:5177; prod: loadFile dist/renderer/index.html
  -> setWindowOpenHandler: openExternalSafe + deny
  -> will-navigate: allow localhost/file, senao preventDefault + openExternalSafe
```

## Erros e Edge Cases
- `getBuildAssetPath` usa `path.basename`; o canal `APP_READ_ASSET` tambem valida nome por Zod.
- `did-fail-load`, `render-process-gone` e `console-message` de erro vao para `console.error`.
- `openExternalSafe` rejeita URL malformada e protocolos fora de allow-list.

## Side Effects
Abre janela Electron, pode abrir browser externo do OS para `https:`/`mailto:`, injeta header CSP em requests do renderer.

## Dependencias
- Internas: [`openSafe.ts`](../../src/main/openSafe.ts), [`shared/constants.ts`](../../src/shared/constants.ts).
- Externas: `electron`, `node:fs`, `node:path`.

## Consumidores
`index.ts`, handlers system de assets, notificacoes e app icon sync.

## Testes
Nao ha teste direto de `createMainWindow` ou `openExternalSafe`.

## Observacoes / Dividas
`installCsp` aceita `isDev`, mas o bootstrap chama somente em producao com `false`; dev sem CSP vem do branch condicional no bootstrap.

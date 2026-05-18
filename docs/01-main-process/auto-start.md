# Auto Start

> **Path:** `src/main/autoStart.ts`
> **Responsabilidade em uma frase:** Registrar ou consultar inicializacao automatica do app no login do sistema.

## Responsabilidade
`setAutoStart` encapsula `app.setLoginItemSettings` e evita registrar `electron.exe` durante desenvolvimento.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `setAutoStart` | function | `(enabled: boolean) => void` | Ativa/desativa openAtLogin em app empacotado. |
| `isAutoStartEnabled` | function | `() => boolean` | Retorna `openAtLogin`; em dev retorna `false`. |

## Fluxo Interno
Em dev, loga e retorna. Em packaged, chama `app.setLoginItemSettings({ openAtLogin, path: process.execPath, args:['--autostart'], name:'BeeforU' })`.

## Erros e Edge Cases
- Dev mode e sempre ignorado para nao registrar `node_modules/electron.exe`.
- Codigo usa APIs Electron multiplataforma; comentario menciona Registry Win/Login Items macOS via Electron.

## Side Effects
Altera configuracao de login do OS em builds empacotados.

## Dependencias
- Internas: [`logger.ts`](../../src/main/logger.ts).
- Externas: `electron`, `node:path`.

## Consumidores
`bootstrap()` e `SETTINGS_SET`.

## Testes
Nao ha teste automatizado.

## Observacoes / Dividas
`isAutoStartEnabled` nao e exposto via IPC atualmente.

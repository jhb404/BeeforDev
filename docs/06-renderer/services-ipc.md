# Services IPC Renderer

> **Path:** `src/renderer/services/ipc/*`
> **Responsabilidade em uma frase:** Criar clients tipados sobre `window.beefor` exposto pelo preload.

## Responsabilidade
Clients agrupam metodos por dominio e sao injetados via `IpcProvider` para facilitar testes e reduzir import direto de `window.beefor`.

## API Publica
| Client | Metodos |
|---|---|
| `sessionClient` | status, login, logout, verify, onStatus, credentials. |
| `settingsClient` | get, set. |
| `timesheetClient` | autoLancamento, lancarHora, fetch, openBeefor. |
| `moodClient` | select, getCurrent. |
| `kudoClient` | send, searchRecipient, getCounts, getLists, getDetail. |
| `teamClient` | fetchMembers. |
| `coin2uClient` | save/get/clear creds, dashboard, log, shop, buy, transfer, verify. |
| `atividadesClient` | fetch. |
| `systemClient` | admin, relaunch, testNotification, alerts, events, assets, notifyWindows. |
| `windowClient` | minimize, maximize, close, setIcon. |

## Fluxo Interno
Cada `create*Client(api)` retorna objeto de funcoes que chamam `api.*`. `IpcProvider` mescla defaults com overrides parciais para testes.

## Erros e Edge Cases
- Clients assumem `window.beefor` existente; garantido pelo preload no Electron.
- Tipos de retorno seguem preload, nem todos `ActionResult`.

## Side Effects
IPC via preload.

## Dependencias
Tipos shared e `BeeforApi` de `src/main/preload.ts`.

## Consumidores
Providers, hooks, pages e features.

## Testes
Factories de IPC em `src/test/factories/ipc.ts` apoiam testes de hooks.

## Observacoes / Dividas
`BeeforApi` e importado de main/preload no renderer para type-only; manter sem runtime import.

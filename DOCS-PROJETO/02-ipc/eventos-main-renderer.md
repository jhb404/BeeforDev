# Eventos Main Renderer

> **Path:** `src/shared/ipc/channels.ts`, `src/main/preload.ts`, `src/main/bootstrap/tray.ts`, `src/main/scheduler/notify.ts`, `src/main/updater.ts`
> **Responsabilidade em uma frase:** Documentar eventos sem request-response entre main e renderer.

## Responsabilidade
Eventos `evt:*` sao emitidos pelo main e assinados pelo preload/renderer; eventos `win:*` e `tray:*` sao `ipcRenderer.send` para `ipcMain.on`.

## API Publica
| Evento | Payload | Emissor | Listener |
|---|---|---|---|
| `evt:status` | `SessionStatus` | `emitStatus` | `preload.onStatus`, `session.client.onStatus` |
| `evt:playAlarm` | `{ title, body, kind? }` | `scheduler/notify.ts` | `system.client.onPlayAlarm`, `useAlarmRouter` |
| `evt:notify` | `{ title, body }` | scheduler, timesheet, tray | `system.client.onNotify`, hooks UI |
| `evt:updateAvailable` | `{ version }` | `updater.ts` | `useUpdater` |
| `evt:updateDownloaded` | `{ version }` | `updater.ts` | `useUpdater` |
| `evt:trayLunchTimer` | none | `tray.ts` | `useTrayListeners` |
| `evt:trayOpenKudo` | none | `tray.ts` | `useTrayListeners` -> app event open kudo |
| `evt:trayOpenCoins` | none | `tray.ts` | `useTrayListeners` -> force open Coin2U |
| `tray:setLunchActive` | boolean | renderer | `system.handlers.ts` -> `setLunchTimerActive` |
| `win:minimize/maximize/close/setIcon` | none / data URL | renderer | `window.handlers.ts` |

## Fluxo Interno
`preload.ts` encapsula `ipcRenderer.on` e retorna cleanup que chama `removeListener`. Isso evita features importarem `electron`.

## Erros e Edge Cases
- `win:setIcon` descarta payload nao-string ou sem prefixo `data:image/`.
- Eventos main -> renderer verificam janela nao destruida em emissores principais.

## Side Effects
UI toasts, audio de alarme, troca de icone da janela, abertura de modais e rebuild de tray.

## Dependencias
- Internas: [channels.md](./channels.md), [`src/main/preload.ts`](../../src/main/preload.ts).
- Externas: `electron`.

## Consumidores
`AppShell`, `useUpdater`, `useTrayListeners`, `useAlarmRouter`, `useAppIconSync`.

## Testes
`useTrayListeners.test.tsx` cobre listeners de tray; `app/events.test.ts` cobre event bus local.

## Observacoes / Dividas
`ACTION_SNOOZE_ALERT` existe como canal, mas snooze atual parece client-side em `useAlerts` sem handler main.

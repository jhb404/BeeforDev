# Main Process

> **Path:** `src/main/`
> **Responsabilidade em uma frase:** Processo Electron com bootstrap, IPC, seguranca, Playwright orchestration, scheduler, tray, storage e updater.

## Responsabilidade
O main process e a unica camada com acesso a Node/Electron APIs, keytar, disco, Playwright e HTTP direto. O renderer fala com ele apenas por `preload.ts` e IPC.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `createMainWindow` | function | `(variant?) => BrowserWindow` | Cria BrowserWindow isolada. |
| `registerIpcHandlers` | function | `(getWindow) => void` | Liga dominios IPC. |
| `ensureSession` | function | `(win, opts?) => Promise<SessionStatus>` | Reusa ou revalida sessao Beefor. |
| `runBeeforAction` | function | `(win, action) => Promise<T>` | Executa action Playwright sob sessao e lock. |
| `setupAutoUpdater` | function | `(getWindow) => void` | Configura electron-updater. |

## Fluxo Interno
Veja [ciclo-de-vida.md](../00-visao-geral/ciclo-de-vida.md) para bootstrap completo. A arquitetura de seguranca esta em [../SEGURANCA.md](../SEGURANCA.md).

## Erros e Edge Cases
- Janela fecha para tray quando `isQuitting` e falso.
- CSP so instala em producao, com rollback `BEEFOR_CSP=0`.
- `registerIpcHandlers` e protegido por `ipcRegistered`.
- `window-all-closed` encerra timers e Playwright.

## Side Effects
Disco em `userData`, keychain, timers, notificacoes, tray, auto-start do OS, BrowserWindow, shell externo validado, Chromium headless.

## Dependencias
- Internas: [../02-ipc/README.md](../02-ipc/README.md), [../03-automation-playwright/README.md](../03-automation-playwright/README.md), [../05-scheduler/README.md](../05-scheduler/README.md).
- Externas: `electron`, `electron-log`, `electron-updater`, `keytar`, `playwright`.

## Consumidores
Electron carrega `dist/main/index.js`; renderer consome main via `preload.ts`.

## Testes
Testes focam IPC schemas/defineHandler. Bootstrap, updater, tray e watchdog nao tem testes diretos.

## Observacoes / Dividas
Automation importa `src/main/logger.ts`, acoplamento ja listado em [../ARQUITETURA.md](../ARQUITETURA.md).

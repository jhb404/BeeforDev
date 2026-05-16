# Visao Geral

> **Path:** `src/main/index.ts`, `src/renderer/App.tsx`, `src/automation/beefor`, `src/main/coin2u`
> **Responsabilidade em uma frase:** Mapear as partes do Beefor Dev e como elas se conectam.

## Responsabilidade
Beefor Dev e um app Electron em que o renderer React chama o main via IPC, o main executa automacoes Beefor com Playwright e integra Coin2U por HTTP direto. A visao macro ja esta em [../ARQUITETURA.md](../ARQUITETURA.md); aqui ficam os pontos de entrada operacionais.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `bootstrap` | private function | `() => Promise<void>` | Inicializa app, CSP, permissoes, splash, IPC, window, tray, Coin2U, watchdog, scheduler e updater em [`src/main/index.ts`](../../src/main/index.ts). |
| `App` | React component | `() => JSX.Element` | Encadeia `IpcProvider -> SettingsProvider -> ThemeProvider -> ToastProvider -> AppShell` em [`src/renderer/App.tsx`](../../src/renderer/App.tsx). |
| `BeeforClient.instance` | static method | `() => BeeforClient` | Singleton Playwright em [`src/automation/beefor/beeforClient.ts`](../../src/automation/beefor/beeforClient.ts). |
| `registerIpcHandlers` | function | `(getWindow) => void` | Registra 11 dominios de handlers em [`src/main/ipc/index.ts`](../../src/main/ipc/index.ts). |

## Fluxo Interno
```ascii
Electron main
  -> bootstrap()
  -> createStartupSplash()
  -> registerIpcHandlers()
  -> createMainWindow()
  -> ensureTray()
  -> initCoin2u()
  -> ensureSession() se autoLoginOnLaunch
  -> revealMainWindow()
  -> startWatchdog() + startScheduler() + setupAutoUpdater()

Renderer
  -> main.tsx
  -> App
  -> Providers
  -> TopBar + Home/Settings + modais de features

Automacao
  -> IPC handler
  -> runBeeforAction/WithReconnect
  -> ensureSessionForAction
  -> withPageLock
  -> Playwright action
```

## Erros e Edge Cases
- `bootstrap()` falha -> loga `Bootstrap failed` e chama `app.quit()`.
- Renderer sem elemento `#root` -> `main.tsx` lanca `root element missing`.
- Sessao Beefor expirada -> actions com reconnect tentam uma vez se erro bater com regex de sessao.
- Coin2U sem credenciais -> auth lanca `Credenciais Coin2U nao configuradas`.

## Side Effects
Disco em `userData`, keytar, notificacoes nativas, tray, timers, Chromium headless, chamadas HTTP Beefor/Coin2U, IPC `evt:*` e localStorage do renderer.

## Dependencias
- Internas: [01-main-process](../01-main-process/README.md), [02-ipc](../02-ipc/README.md), [03-automation-playwright](../03-automation-playwright/README.md), [04-coin2u](../04-coin2u/README.md), [06-renderer](../06-renderer/README.md).
- Externas: `electron`, `playwright`, `react`, `zod`, `keytar`, `electron-updater`.

## Consumidores
Engenharia do projeto e qualquer fluxo de manutencao que precise localizar ownership por camada.

## Testes
Cobertura distribuida em `src/shared/result.test.ts`, `src/main/ipc/*.test.ts`, hooks do renderer e utils. Ver [../11-testes/README.md](../11-testes/README.md).

## Observacoes / Dividas
- Ver [../12-debito-tecnico/README.md](../12-debito-tecnico/README.md) para divergencia de versao e lacunas de cobertura.

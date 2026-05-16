# Ciclo de Vida

> **Path:** `src/main/index.ts`, `src/main/startupSplash.ts`, `src/main/bootstrap/windowReveal.ts`
> **Responsabilidade em uma frase:** Documentar bootstrap, janela, watchdog, scheduler e shutdown.

## Responsabilidade
O ciclo de vida do main garante que o app inicialize com renderer isolado, IPC registrado uma vez, splash visivel ate o primeiro paint, tray ativo e loops de sessao/scheduler ligados apenas depois da janela estar pronta.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `createStartupSplash` | function | `(variant) => BrowserWindow` | Cria splash sandboxed com HTML data URL em [`startupSplash.ts`](../../src/main/startupSplash.ts). |
| `closeStartupSplash` | function | `(splash) => Promise<void>` | Respeita `MIN_SPLASH_MS` e executa fade-out. |
| `revealMainWindow` | function | `(win, splash?) => Promise<void>` | Espera paint, mostra janela, fecha splash e aplica fade-in em [`windowReveal.ts`](../../src/main/bootstrap/windowReveal.ts). |
| `startWatchdog` | function | `(getWin) => void` | Inicia loop de verificacao de sessao em [`sessionManager.ts`](../../src/main/sessionManager.ts). |
| `startScheduler` | function | `(getWin) => void` | Inicia tick de 30s em [`scheduler/index.ts`](../../src/main/scheduler/index.ts). |

## Fluxo Interno
```ascii
app.whenReady()
  -> app.setName('Beefor U')
  -> installCsp(false) em prod, exceto BEEFOR_CSP=0
  -> negar permissoes Web
  -> createStartupSplash('orange')
  -> loadSettings()
  -> registerIpcHandlers(getWindow)
  -> createMainWindow(variant)
  -> ensureTray(...)
  -> setAutoStart(settings.autoStart)
  -> initCoin2u()
  -> ensureSession() se autoLoginOnLaunch
  -> revealMainWindow(mainWindow, splash)
  -> startWatchdog + startScheduler + setupAutoUpdater
```

## Erros e Edge Cases
- `ensureIpcHandlers()` usa flag `ipcRegistered`; evita registrar handlers duplicados em reabertura de janela.
- `close` da janela principal vira `hide()` se `isQuitting` for falso.
- `window-all-closed` para watchdog/scheduler e fecha `BeeforClient`; no macOS nao chama `app.quit()`.
- CSP nao instala em dev e pode ser desativada por `BEEFOR_CSP=0` em producao.

## Side Effects
Cria janelas Electron, registra tray, nega permissoes Web globais, inicia timers, abre Playwright se auto-login ativo, configura auto-updater e pode registrar auto-start do OS.

## Dependencias
- Internas: [`window.ts`](../../src/main/window.ts), [`sessionManager.ts`](../../src/main/sessionManager.ts), [`scheduler/index.ts`](../../src/main/scheduler/index.ts), [`updater.ts`](../../src/main/updater.ts).
- Externas: `electron`.

## Consumidores
Ponto de entrada `dist/main/index.js`, configurado como `main` em [`package.json`](../../package.json).

## Testes
Nao ha teste direto de `bootstrap()`; lacuna registrada em [../12-debito-tecnico/README.md](../12-debito-tecnico/README.md).

## Observacoes / Dividas
O prompt citava watchdog antes de scheduler; no codigo ambos iniciam apos `revealMainWindow().then(...)`.

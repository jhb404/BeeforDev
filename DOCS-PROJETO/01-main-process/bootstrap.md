# Bootstrap

> **Path:** `src/main/index.ts`, `src/main/bootstrap/*`, `src/main/startupSplash.ts`
> **Responsabilidade em uma frase:** Inicializar Electron, seguranca global, janela, tray, Coin2U, sessao e loops.

## Responsabilidade
`bootstrap()` e o orquestrador de startup. Ele chama `app.whenReady()`, instala CSP/permissoes, carrega settings, cria splash e janela, registra IPC, prepara tray, inicializa Coin2U, executa auto-login opcional e so depois inicia watchdog/scheduler/updater.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `ensureTray` | function | `(opts) => Tray` | Cria singleton do tray em [`tray.ts`](../../src/main/bootstrap/tray.ts). |
| `rebuildTrayMenu` | function | `() => Promise<void>` | Recarrega menu pelo `settings.trayMenu`. |
| `setLunchTimerActive` | function | `(active) => void` | Atualiza label/estado do item de timer do tray. |
| `notifyWindows` | function | `(title, body, variant?) => void` | Mostra notificacao nativa ou loga fallback. |
| `revealMainWindow` | function | `(win, splash?) => Promise<void>` | Controla primeiro paint e fade-in da janela principal. |
| `createStartupSplash` | function | `(variant) => BrowserWindow` | Cria splash HTML isolado. |

## Fluxo Interno
```ascii
bootstrap
  -> app.whenReady
  -> installCsp(false) se prod
  -> setPermissionRequestHandler(false)
  -> createStartupSplash('orange')
  -> loadSettings
  -> ensureIpcHandlers
  -> createMainWindow(settings.logoVariant)
  -> bindLoggerWindow + wireMainWindow
  -> ensureTray
  -> setAutoStart
  -> initCoin2u
  -> ensureSession se autoLoginOnLaunch
  -> revealMainWindow(...).then(startWatchdog, startScheduler, setupAutoUpdater)
```

## Erros e Edge Cases
- `initCoin2u()` falha best-effort: loga warning e nao aborta startup.
- `revealMainWindow` protege contra janela destruida durante o fade.
- `ensureTray` retorna instancia existente se chamada novamente.
- `startupSplash` usa `MIN_SPLASH_MS = 5000`; splash nao fecha antes disso.

## Side Effects
Registra handlers Electron globais, cria janelas, tray e menu, toca audio no splash via WebAudio, chama `app.setLoginItemSettings`, inicia timers.

## Dependencias
- Internas: [`window.ts`](../../src/main/window.ts), [`sessionStore.ts`](../../src/main/sessionStore.ts), [`scheduler/index.ts`](../../src/main/scheduler/index.ts), [`updater.ts`](../../src/main/updater.ts).
- Externas: `electron`.

## Consumidores
Entrada principal `src/main/index.ts` e reconstrucoes do menu via `settings.handlers.ts`.

## Testes
Nao ha teste automatizado de bootstrap/tray/splash.

## Observacoes / Dividas
Itens `openBeefor` e `logout` no tray hoje apenas chamam `onShowWindow()`; nao executam diretamente abrir Beefor/logout.

# Session Lifecycle

> **Path:** `src/main/sessionManager.ts`, `src/main/sessionGuard.ts`, `src/main/sessionStore.ts`, `src/main/statusBus.ts`
> **Responsabilidade em uma frase:** Manter status e persistencia de sessao Beefor e settings.

## Responsabilidade
A sessao Beefor combina status em memoria, credenciais no keytar, storageState no disco e verificacao periodica via Playwright. `ensureSessionForAction` e a fronteira usada antes de actions.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `ensureSession` | function | `(win, opts?) => Promise<SessionStatus>` | Deduplica chamadas concorrentes e reconecta se necessario. |
| `startWatchdog` | function | `(getWin) => void` | A cada 60s verifica sessao quando status e `connected`. |
| `stopWatchdog` | function | `() => void` | Para timer do watchdog. |
| `ensureSessionForAction` | function | `(win) => Promise<void>` | Lanca erro se sessao nao ficar `connected`. |
| `forceReconnect` | function | `(win) => Promise<void>` | Emite `expired` e chama ensure para reacessar. |
| `loadSettings` | function | `() => Promise<AppSettings>` | Le JSON e injeta `patchJournal`. |
| `saveSettings` | function | `(s) => Promise<void>` | Salva settings omitindo `patchJournal`. |
| `emitStatus` | function | `(win, status) => void` | Atualiza status em memoria e envia `EVT_STATUS`. |

## Fluxo Interno
```ascii
ensureSession
  -> se inFlight: retorna mesma Promise
  -> se currentStatus === connected: retorna connected
  -> emitStatus('loading')
  -> withPageLock
      -> se session file existe: BeeforClient.getPage(sessionPath) + doVerifySession
      -> senao ou invalida: getCredentials + performLogin + persistSession
      -> emitStatus('connected') + warmKudoRecipientCache
```

## Erros e Edge Cases
- Sem credenciais -> status `disconnected` e retorno `disconnected`.
- Falha no fluxo -> status `expired` e retorno `expired`.
- `loadSettings` retorna defaults se o arquivo nao existir ou falhar parse/read.
- `patchJournal` nunca e persistido por `saveSettings`.

## Side Effects
Le/escreve `beefor-settings.json`, remove `beefor-session.json`, envia `evt:status`, aquece cache de kudo, inicia timer de watchdog.

## Dependencias
- Internas: [secure-storage.md](./secure-storage.md), [beefor-token-cache.md](./beefor-token-cache.md), [../03-automation-playwright/session.md](../03-automation-playwright/session.md).
- Externas: `electron`, `fs/promises`, `path`.

## Consumidores
Handlers session/settings, `beeforActionRunner`, scheduler, bootstrap e Coin2U handlers para persistir userId/info.

## Testes
Nao ha teste direto para `sessionManager` ou `sessionStore`.

## Observacoes / Dividas
`SETTINGS_FILE` no codigo e `beefor-settings.json`, enquanto alguns docs legados citam `settings.json`.

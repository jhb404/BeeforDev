# Services

> **Path:** `src/main/services/beeforActionRunner.ts`, `src/main/services/result.ts`
> **Responsabilidade em uma frase:** Executar actions Beefor com sessao valida, page lock e retry opcional.

## Responsabilidade
`beeforActionRunner` e a fronteira padrao entre handlers IPC e Playwright. Ele garante sessao conectada antes da action e serializa acesso a Page compartilhada.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `runBeeforAction` | function | `(win, action) => Promise<T>` | Sem retry; chama `ensureSessionForAction` e `withPageLock`. |
| `runBeeforActionWithReconnect` | function | `(win, label, action) => Promise<T>` | Retry 1x se erro parecer sessao expirada. |

## Fluxo Interno
```ascii
runBeeforAction
  -> ensureSessionForAction(win)
  -> withPageLock
  -> BeeforClient.instance().getPage()
  -> action(page)

runBeeforActionWithReconnect
  -> ensureSessionForAction
  -> exec()
  -> catch stale-session regex
  -> forceReconnect(win)
  -> exec() novamente
```

## Erros e Edge Cases
- Regex de sessao: `/Sess(ão|ao)|expirou|expirada|sess|timeout/i`.
- Retry acontece uma vez; segundo erro sobe para `defineHandler`, que retorna `fail(err)`.
- `runBeeforAction` nao faz retry para lancar/fetch timesheet atuais.

## Side Effects
Pode emitir status, abrir/reutilizar Chromium, adquirir lock global e logar reconnect.

## Dependencias
- Internas: [`sessionGuard.ts`](../../src/main/sessionGuard.ts), [`pageLock.ts`](../../src/automation/beefor/pageLock.ts), [`beeforClient.ts`](../../src/automation/beefor/beeforClient.ts).
- Externas: type `BrowserWindow`, type `Page`.

## Consumidores
Handlers timesheet, mood, kudo, team e tray actions.

## Testes
Nao ha teste direto.

## Observacoes / Dividas
`ACTION_LANCAR_HORA` usa runner sem reconnect; se sessao expirar no meio da action, caller recebe erro.

# Automation Playwright

> **Path:** `src/automation/beefor/`
> **Responsabilidade em uma frase:** Automatizar Beefor com um Chromium Playwright compartilhado, sessao persistida e page lock.

## Responsabilidade
A automacao Beefor roda no main process. `BeeforClient` possui browser/context/page singleton, `pageLock` serializa operacoes e actions executam login, mood, kudo, team e timesheet.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `BeeforClient` | class singleton | `instance(), getPage(), persistSession(), close()` | Ciclo de vida Playwright. |
| `withPageLock` | function | `(fn) => Promise<T>` | Mutex por chain promise. |
| `Selectors` | const | object | Seletores centralizados. |
| actions barrel | exports | `do*` | Exporta session, mood, timesheet, kudo e team. |

## Fluxo Interno
```ascii
handler IPC
  -> runBeeforAction/WithReconnect
  -> ensureSessionForAction
  -> withPageLock
  -> BeeforClient.instance().getPage()
  -> action(page)
```

## Erros e Edge Cases
- Uma Page compartilhada significa que qualquer action concorrente precisa passar pelo lock.
- `BEEFOR_HEADED=1` troca para browser visivel.
- StorageState legado plaintext e aceito no read e recriptografado no proximo persist.

## Side Effects
Chromium headless, arquivos de storageState, fetches dentro da pagina, navegacoes Beefor, estado singleton.

## Dependencias
- Internas: [../01-main-process/services.md](../01-main-process/services.md), [../09-armazenamento/beefor-session.md](../09-armazenamento/beefor-session.md).
- Externas: `playwright`.

## Consumidores
Handlers IPC e tray actions.

## Testes
Nao ha testes para `src/automation`.

## Observacoes / Dividas
Imports de `../../main/logger` acoplam automacao ao main.

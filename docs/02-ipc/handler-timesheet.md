# Handler Timesheet

> **Path:** $path
> **Responsabilidade em uma frase:** Executar fluxos de timesheet e abrir Beefor externo.

## Responsabilidade
Este handler registra canais do dominio e delega trabalho para services, storage, Playwright ou HTTP conforme necessario.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| egisterTimesheetHandlers | function | (...) => void | Registra os canais do dominio com defineHandler ou defineEventHandler. |

## Fluxo Interno
- `ACTION_AUTO_LANCAMENTO` usa `runBeeforActionWithReconnect(doAutoLancamento)` e envia `EVT_NOTIFY` ok/fail.
- `ACTION_OPEN_BEEFOR` chama `openExternalSafe(BEEFOR_LOGIN_URL)`.
- `ACTION_LANCAR_HORA` valida `timesheetEntrySchema` e chama `doLancarHora` via `runBeeforAction`.
- `ACTION_FETCH_TIMESHEET` valida tupla year/month, usa `withTimeout(...,60000)` e `doFetchTimesheet`.

## Erros e Edge Cases
- Excecoes dentro de un sao capturadas por defineHandler e retornam ail(err) quando o canal e invoke.
- Payloads dinamicos usam schemas listados em [schemas.md](./schemas.md).

## Side Effects
IPC, logs e side effects do service/action chamado.

## Dependencias
Ver imports no arquivo fonte citado no topo.

## Consumidores
Preload em [src/main/preload.ts](../../src/main/preload.ts) e clients em [src/renderer/services/ipc](../../src/renderer/services/ipc).

## Testes
Cobertura direta de handlers e parcial; defineHandler e schemas possuem testes.

## Observacoes / Dividas
Detalhes de canais tambem estao em [channels.md](./channels.md).

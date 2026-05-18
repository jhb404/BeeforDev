# Actions Beefor

> **Path:** `src/automation/beefor/actions/`
> **Responsabilidade em uma frase:** Exportar operacoes Playwright/Beefor por dominio.

## Responsabilidade
O barrel `index.ts` exporta `session`, `mood`, `timesheet`, `kudo` e `team`. Handlers IPC importam daqui para evitar conhecer subestrutura de timesheet.

## API Publica
| Arquivo | Exports principais | Documentacao |
|---|---|---|
| `session.ts` | `performLogin`, `isLoggedIn`, `doVerifySession`, `doLogout` | [session.md](./session.md) |
| `mood.ts` | `doSelectMood`, `doGetCurrentMood`, `doGetCurrentMoodViaApi` | [mood.md](./mood.md) |
| `kudo.ts` | search/count/list/detail/send/cache warm | [kudo.md](./kudo.md) |
| `team.ts` | `doFetchTeamMembers` | [team.md](./team.md) |
| `timesheet/` | `doAutoLancamento`, `doFetchTimesheet`, `doLancarHora` | [timesheet.md](./timesheet.md) |

## Fluxo Interno
Handlers main chamam actions via `runBeeforAction` ou `runBeeforActionWithReconnect`.

## Erros e Edge Cases
Cada action lanca `Error`; handlers convertem para `ActionResult`.

## Side Effects
Navegacao Playwright, DOM, API Beefor via page context, cache em memoria.

## Dependencias
Selectors, internals, shared types/constants e logger.

## Consumidores
Handlers IPC e tray actions.

## Testes
Sem testes de actions.

## Observacoes / Dividas
Pasta `timesheet/` e uma action de dominio composta por varios arquivos internos.

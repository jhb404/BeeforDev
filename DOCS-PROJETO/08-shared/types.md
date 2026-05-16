# Shared Types

> **Path:** `src/shared/types/*`
> **Responsabilidade em uma frase:** Definir shapes serializaveis usados nos contratos IPC e UI.

## Responsabilidade
Tipos compartilhados evitam divergencia entre main/preload/renderer.

## API Publica
| Arquivo | Simbolos |
|---|---|
| `common.ts` | `ActionResult<T>`, `LogEntry`, `TimeStr`. |
| `session.ts` | `SessionStatus`, `Credentials`. |
| `mood.ts` | `Mood`, `MOODS`, `MOOD_BY_SENTIMENTO`. |
| `timesheet.ts` | `TimesheetEntry`, `FetchedTimesheetRow`. |
| `kudo.ts` | tipos KudoCard, labels, emojis, maps tipo<->type, requests/results/lists/detail. |
| `team.ts` | `TeamChecklistAnswer`, `TeamMember`. |
| `coin2u.ts` | Dashboard, credentials, member, transaction, log, shop/category/item, transfer/buy requests, org/info. |
| `app.ts` | `AppSettings`, `ThemeOverrides`, tray menu, `TodayAlert`. |
| `atividades.ts` | `BeeforAtividade`. |
| `index.ts` | Reexports. |

## Fluxo Interno
Types sao usados em preload signatures e clients renderer; schemas Zod implementam validacao runtime para parte desses tipos.

## Erros e Edge Cases
- `AppSettings.punchTimes` e tupla de 4 strings no tipo; schema aceita array ate 8.
- `Coin2uShopCategory.Decription` preserva typo da API.
- Muitos campos Coin2U permitem `unknown`/index signature porque API pode crescer.

## Side Effects
Nenhum.

## Dependencias
Apenas types locais.

## Consumidores
Main, preload, renderer, automation.

## Testes
Tipos nao tem teste runtime; schemas cobrem subset.

## Observacoes / Dividas
Para contratos externos instaveis, adicionar fixtures e parsers mais estritos.

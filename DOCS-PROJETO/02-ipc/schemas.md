# Schemas IPC

> **Path:** `src/main/ipc/schemas.ts`
> **Responsabilidade em uma frase:** Validar payloads vindos do renderer antes de handlers main executarem side effects.

## Responsabilidade
Schemas Zod restringem credenciais, settings, lancamentos, KudoCard, Coin2U, notificacoes e asset reads.

## API Publica
| Schema | Forma | Restricoes | Usado por |
|---|---|---|---|
| `credentialsSchema` | `{ email, password }` | email valido max 254; senha 1..256 | `CREDS_SAVE` |
| `coin2uCredentialsSchema` | `{ email, password }` | mesmo contrato de credenciais | `COIN2U_SAVE_CREDS` |
| `moodSchema` | enum mood | quatro labels Beefor | `ACTION_SELECT_MOOD` |
| `timesheetEntrySchema` | `TimesheetEntry` | `date YYYY-MM-DD`; horarios `HH:MM` ou vazio; comentario max 500 | `ACTION_LANCAR_HORA` |
| `fetchTimesheetArgsSchema` | tuple `[year, month]` | year 2000..2100; month 1..12 | `ACTION_FETCH_TIMESHEET` |
| `kudoRecipientTypeSchema` | enum | `person` ou `team` | schema auxiliar |
| `kudoSearchArgsSchema` | tuple `[type, query]` | query 1..120 | `ACTION_SEARCH_KUDO_RECIPIENT` |
| `sendKudoCardSchema` | `{ recipientType, recipientName, message, cardType }` | nome 1..200; msg 1..1000; card enum | `ACTION_SEND_KUDO_CARD` |
| `kudoDetailIdSchema` | string | 1..64 | `ACTION_KUDO_DETAIL` |
| `coin2uTransferSchema` | `{ To, Amount, Message }` | ints positivos; Amount max 1_000_000; Message max 500 default `''` | `COIN2U_TRANSFER` |
| `coin2uBuyItemSchema` | `{ shopItemId, price }` | ints positivos; price max 10_000_000 | `COIN2U_BUY_ITEM` |
| `notifyTestKindSchema` | enum | `mood`, `lunch`, `kudocard`, `punch` | `NOTIFY_TEST` |
| `notifyWindowsArgsSchema` | tuple `[title, body, variant?]` | title max 200; body max 2000; variant orange/purple | `ACTION_NOTIFY` |
| `assetFileNameSchema` | string | 1..120, regex `[A-Za-z0-9._-]+` | `APP_READ_ASSET` |
| `settingsSchema` | partial strict core + passthrough | core booleans/numeros/arrays; permite extras future-compatible | `SETTINGS_SET` |

## Fluxo Interno
`defineHandler` chama `validate(schema, payload(args))`; falha gera `fail(new Error('Payload invalido'))`.

## Erros e Edge Cases
- `settingsSchema` usa `.passthrough()` para aceitar campos como `logoVariant`, `patchJournal`, `themePresetId`.
- `punchTimes` no schema e `z.array(timeStr).max(8)`, apesar de `AppSettings` declarar tupla de 4 strings.
- `notifyWindowsArgsSchema` usa payload como array completo porque o preload envia 2 ou 3 args.

## Side Effects
Nenhum direto alem de logs em validacao via `validate.ts`.

## Dependencias
- Externas: `zod`.

## Consumidores
Handlers IPC.

## Testes
`src/main/ipc/schemas.test.ts`.

## Observacoes / Dividas
`WIN_SET_ICON` valida manualmente no handler e nao usa schema Zod.

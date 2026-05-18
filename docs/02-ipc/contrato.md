# Contrato IPC

> **Path:** `src/shared/result.ts`, `src/shared/types/common.ts`, `src/main/ipc/defineHandler.ts`, `src/main/ipc/validate.ts`
> **Responsabilidade em uma frase:** Padronizar retorno, validacao e tratamento de erro dos canais IPC.

## Responsabilidade
Handlers com trabalho assinc retornam `ActionResult<T>` quando precisam comunicar sucesso/erro de negocio. `defineHandler` captura excecoes, loga e converte para `fail(err)`. `validate` usa Zod antes do handler executar.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `ActionResult<T>` | type | `{ok:true,data} | {ok:false,error}` | Tipo em [`common.ts`](../../src/shared/types/common.ts). |
| `ok` | function | `() => ActionResult<void>` / `(data:T)=>ActionResult<T>` | Cria variante sucesso. |
| `fail` | function | `(error: unknown) => ActionResult<never>` | Cria variante erro com mensagem. |
| `withTimeout` | function | `(p, ms, label) => Promise<T>` | Race com timeout. |
| `getError` | function | `(res) => string` | Extrai erro ou `''`. |
| `isErr` / `isOk` | type guard | `(res) => boolean` | Narrow de union. |
| `defineHandler` | function | `(options) => void` | Registra `ipcMain.handle`, valida e captura erro. |
| `defineEventHandler` | function | `(options) => void` | Registra `ipcMain.on`, valida e loga erro sem retorno. |
| `validate` | function | `(schema,payload) => ValidationOutcome` | Retorna `{ok:true,data}` ou `{ok:false,result}`. |

## Fluxo Interno
```ascii
ipcMain.handle(channel, async (event, ...args) => {
  if schema:
    parsed = validate(schema, payload(args))
    if !parsed.ok return parsed.result
  try return await run({ event, args, data })
  catch err: logger.error; return fail(err)
})
```

## Erros e Edge Cases
- `defaultPayload` usa `args[0]` para 0/1 arg e array para 2+ args.
- Handlers com tupla usam `payload: args => args`.
- `defineEventHandler` descarta resultado de validacao invalida porque eventos nao retornam promise ao renderer.

## Side Effects
Registra handlers globais em `ipcMain`, escreve logs, converte excecoes em objeto serializavel.

## Dependencias
- Internas: [`logger.ts`](../../src/main/logger.ts), [`shared/result.ts`](../../src/shared/result.ts).
- Externas: `electron`, `zod`.

## Consumidores
Todos os arquivos em `src/main/ipc/handlers`.

## Testes
`src/main/ipc/__tests__/defineHandler.test.ts`, `src/main/ipc/schemas.test.ts`, `src/shared/result.test.ts`.

## Observacoes / Dividas
Nem todo canal retorna `ActionResult`: `SETTINGS_GET`, `SESSION_STATUS`, `APP_GET_ASSET_PATH`, `APP_READ_ASSET` e credenciais masked retornam valores diretos.

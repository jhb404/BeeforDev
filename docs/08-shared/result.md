# Result

> **Path:** `src/shared/result.ts`, `src/shared/types/common.ts`
> **Responsabilidade em uma frase:** Padronizar sucesso/erro serializavel em chamadas IPC.

## Responsabilidade
`ActionResult<T>` evita throw cruzando IPC para erros esperados e ajuda UI a exibir mensagens.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `ok` | function overload | `()`, `(data:T)` | Cria `{ ok:true, data }`. |
| `fail` | function | `(error: unknown) => ActionResult<never>` | Converte Error/string para `{ok:false,error}`. |
| `withTimeout` | function | `(promise, ms, label) => Promise<T>` | Rejeita com `${label}: timeout apos ${ms}ms`. |
| `getError` | function | `(res) => string` | `''` se ok. |
| `isErr` | function | type guard | Narrow para erro. |
| `isOk` | function | type guard | Narrow para sucesso. |

## Fluxo Interno
`defineHandler` usa `fail(err)` em catch; handlers retornam `ok(data)` em sucesso; renderer chama `getError` em Settings.

## Erros e Edge Cases
- `ok()` retorna `data: undefined`.
- `withTimeout` nao cancela a promise original; apenas rejeita a race.

## Side Effects
`withTimeout` cria timer.

## Dependencias
`ActionResult` type.

## Consumidores
Handlers IPC, renderer Settings/Home/features.

## Testes
`src/shared/result.test.ts`.

## Observacoes / Dividas
Padrao nao carrega codigo de erro estruturado; apenas string.

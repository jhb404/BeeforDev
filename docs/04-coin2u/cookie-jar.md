# Cookie Jar

> **Path:** `src/main/coin2u/cookieJar.ts`
> **Responsabilidade em uma frase:** Manter cookies Coin2U em memoria e serializar para header/persistencia.

## Responsabilidade
`CookieJar` e um wrapper simples sobre `Map<string,string>` com parse de `Set-Cookie`, exportacao para header e record.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `CookieJar` | class | `new CookieJar()` | Jar em memoria. |
| `set` | method | `(name,value) => void` | Define cookie. |
| `setFromHeader` | method | `(setCookieHeader) => void` | Parse de header combinado. |
| `toHeader` | method | `() => string` | Retorna `a=b; c=d`. |
| `size` | method | `() => number` | Quantidade de cookies. |
| `clear` | method | `() => void` | Limpa map. |
| `toRecord/loadRecord` | methods | record in/out | Persistencia em JSON. |

## Fluxo Interno
`setFromHeader` divide por virgula seguida de `name=`, pega primeira parte antes de `;`, separa no primeiro `=` e salva.

## Erros e Edge Cases
- Header nulo e ignorado.
- Partes sem `=` ou nome vazio sao ignoradas.

## Side Effects
Estado em memoria.

## Dependencias
Nenhuma.

## Consumidores
`Coin2uAuthManager`.

## Testes
Sem teste automatizado.

## Observacoes / Dividas
Parser nao implementa RFC completo de cookies; suficiente para headers atuais do Coin2U.

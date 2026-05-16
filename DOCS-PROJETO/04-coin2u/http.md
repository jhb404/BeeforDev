# Coin2U HTTP

> **Path:** `src/main/coin2u/http.ts`
> **Responsabilidade em uma frase:** Executar GET/POST autenticados com headers Coin2U e retry em falha de auth.

## Responsabilidade
Centraliza headers comuns, conversao path->URL absoluta, cookie header, token em `Authorization` e retry de sessao.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `coin2uAuthedGet` | function | `(pathOrUrl) => Promise<Response>` | GET com auth e retry. |
| `coin2uAuthedPost` | function | `(pathOrUrl,payload) => Promise<Response>` | POST JSON com auth e retry. |

## Fluxo Interno
`loadFromDisk` -> `ensureFresh` -> `fetch` com `redirect:'manual'` -> `retryOnAuthFailure`. Retry aplica Set-Cookie, verifica status 401/302/403, evita loop se token tem <=5s, invalida, loga in e refaz request.

## Erros e Edge Cases
- `Authorization` e token cru, sem prefixo Bearer.
- URL relativa recebe base `COIN2U_URL`.
- Retry nao ocorre para 4xx diferentes de 401/302/403.

## Side Effects
Rede, cookies em auth manager, possivel relogin.

## Dependencias
`coin2uAuth`, constants e logger.

## Consumidores
`endpoints.ts`.

## Testes
Sem teste automatizado.

## Observacoes / Dividas
User-Agent hardcoded em Chrome 147.

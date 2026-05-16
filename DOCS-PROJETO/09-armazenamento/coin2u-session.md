# Coin2U Session

> **Path:** `src/main/coin2u/auth.ts`, `src/main/safeStore.ts`
> **Responsabilidade em uma frase:** Persistir snapshot de sessao Coin2U criptografado.

## Responsabilidade
Evita relogar Coin2U a cada request enquanto TTL permitir.

## API Publica
| Campo persistido | Descricao |
|---|---|
| `userId` | Usuario Coin2U autenticado. |
| `tokenApi` | Token usado em query/header. |
| `cookies` | Record do CookieJar. |
| `info` | Objeto Info completo do login. |
| `loggedAt` | Timestamp usado para TTL 25min. |

## Fluxo Interno
`loadFromDisk` le/decifra/parseia e popula manager; `persist` serializa e criptografa apos login.

## Erros e Edge Cases
- `loadedFromDisk` evita releitura no mesmo processo.
- `clear` remove arquivo e ignora ENOENT.
- Stale >25min aciona novo login.

## Side Effects
Disco userData e estado em memoria.

## Dependencias
Electron app path, safeStore, CookieJar.

## Consumidores
Coin2U HTTP/endpoints/handlers.

## Testes
Sem teste.

## Observacoes / Dividas
Mesmo criptografado, malware no user atual pode chamar DPAPI/safeStorage; ver [../SEGURANCA.md](../SEGURANCA.md).

# Beefor Token Cache

> **Path:** `src/main/beeforTokenCache.ts`
> **Responsabilidade em uma frase:** Cachear token e `idPessoa` do Beefor extraidos do localStorage da pagina Playwright.

## Responsabilidade
Atividades usa HTTP direto para `Quadro/ListarMinhasTarefas`. Para isso precisa do Bearer token e `idPessoa`, extraidos de `localStorage.user1` via Playwright e mantidos em memoria por 25 minutos.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `getBeeforTokenCache` | function | `() => BeeforTokenEntry | null` | Retorna cache se existir e nao expirou. |
| `invalidateBeeforTokenCache` | function | `() => void` | Limpa cache em memoria. |
| `refreshBeeforTokenCache` | function | `(page) => Promise<BeeforTokenEntry | null>` | Le `localStorage.user1` e atualiza cache. |

## Fluxo Interno
`refreshBeeforTokenCache` avalia codigo no browser, faz `JSON.parse(localStorage.getItem('user1'))`, tenta `token` e `idPessoa` em caminhos alternativos, e grava `{ token, idPessoa, cachedAt }`.

## Erros e Edge Cases
- Cache expira depois de `25 * 60 * 1000` ms.
- LocalStorage ausente ou shape inesperado retorna `null`.
- Falha de evaluate loga warning e retorna `null`.

## Side Effects
Estado global em memoria; log warning em falha.

## Dependencias
- Internas: [`logger.ts`](../../src/main/logger.ts).
- Externas: `playwright` type `Page`.

## Consumidores
[`src/main/ipc/handlers/atividades.handlers.ts`](../../src/main/ipc/handlers/atividades.handlers.ts).

## Testes
Nao ha teste dedicado.

## Observacoes / Dividas
Cache nao persiste em disco e nao e invalidado automaticamente por logout, mas logout fecha client e limpa sessao.

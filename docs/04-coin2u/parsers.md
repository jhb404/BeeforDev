# Coin2U Parsers

> **Path:** `src/main/coin2u/parsers.ts`
> **Responsabilidade em uma frase:** Normalizar arrays variaveis da API Coin2U para tipos compartilhados.

## Responsabilidade
Parsers aceitam casing Pascal/camel e descartam entradas sem identificador valido.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `parseMembers` | function | `(value) => Coin2uMember[]` | Mapeia `Value/value`, `Text/text`, filtra id/texto validos. |
| `parseTransactions` | function | `(value) => Coin2uTransaction[]` | Mapeia transacoes e filtra `TransactionId > 0`. |
| `parseShopItems` | function | `(value) => Coin2uShopItem[]` | Mapeia itens, categoria e filtra `Id > 0` e nome. |

## Fluxo Interno
Se entrada nao e array, retorna `[]`. Cada parser usa `Number`, `String`, defaults nulos e filtros finais.

## Erros e Edge Cases
- Campos opcionais ficam `null` quando ausentes.
- Categoria usa campo `Decription` conforme tipo legado; tambem aceita `Description`.

## Side Effects
Nenhum.

## Dependencias
Tipos shared Coin2U.

## Consumidores
`endpoints.ts`.

## Testes
Sem teste direto.

## Observacoes / Dividas
Typos de API (`Decription`) sao preservados no tipo para compatibilidade.

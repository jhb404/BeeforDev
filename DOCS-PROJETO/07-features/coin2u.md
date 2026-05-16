# Feature Coin2U

> **Path:** `src/renderer/features/coin2u/*`, `src/main/coin2u/*`
> **Responsabilidade em uma frase:** UI de carteira Coin2U: saldo, envio, shop, compras e historico.

## Responsabilidade
Coin2U renderer usa badge/topbar e modal com tabs. Hooks carregam dashboard/log/shop, cacheiam dados e exibem toasts locais.

## API Publica
| Simbolo | Tipo | Descricao |
|---|---|---|
| `Coin2uBadge` | component | Badge/resumo e abertura do modal. |
| `Coin2uModal` | component | Modal com tabs send/shop/purchases/history. |
| `Coin2uHeader` | component | Header e tab control. |
| `Coin2uSendTab` | component | Transferencia para membro. |
| `Coin2uShopTab` | component | Loja e filtro de itens. |
| `Coin2uConfirmPurchase` | component | Confirmacao de compra. |
| `Coin2uHistoryTab` / `Coin2uPurchasesTab` | components | Historico/transacoes de compra. |
| `useCoin2uData` | hook | Dashboard/log/settings/cache. |
| `useCoin2uShop` | hook | Shop e compra. |
| `useCoin2uToast` | hook | Toast local temporizado. |
| `coin2uFormat` | utils | Formatacao e filtros. |

## Fluxo Interno
Badge pode forcar abertura via evento de tray. Modal usa data hook, passa dashboard/log/settings para tabs. Transferencia chama `coin2uClient.transfer`; compra chama `coin2uClient.buyItem` e atualiza dados.

## Erros e Edge Cases
- Sem credenciais/conexao mostra estado de falha via retorno IPC.
- Cache local reduz tela vazia entre refreshes.
- Compra pode retornar sucesso mesmo com HTTP 500 no main por workaround documentado.

## Side Effects
IPC Coin2U, localStorage cache, toasts, state modal.

## Dependencias
Clients IPC, utils cache/format, components common.

## Consumidores
TopBar e AppShell via force open.

## Testes
`coin2uFormat.test.ts`, `useCoin2uToast.test.ts`.

## Observacoes / Dividas
Main precisa de fixtures reais de response para endurecer parsers.

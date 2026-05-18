# Feature Kudo

> **Path:** `src/renderer/features/kudo/*`, `src/automation/beefor/actions/kudo.ts`
> **Responsabilidade em uma frase:** UI para enviar e consultar historico de KudoCards.

## Responsabilidade
A feature fornece modal de envio, modal de historico e hooks para busca de destinatario, envio e listas/detalhe.

## API Publica
| Simbolo | Tipo | Descricao |
|---|---|---|
| `KudoCardModal` | component | Form de envio de card. |
| `KudoCardHistoryModal` | component | Historico enviados/recebidos e detalhe. |
| `useKudoRecipientSearch` | hook | Busca pessoa/time com debounce/estado. |
| `useKudoCardSend` | hook | Envio com loading/erro. |
| `useKudoHistory` | hook | Counts/list/detail. |

## Fluxo Interno
Home abre modal por botao ou app event do tray. Modal chama hooks -> `kudoClient` -> IPC -> Playwright action.

## Erros e Edge Cases
- Busca menor que minimo retorna vazio no action.
- Envio pode falhar por autocomplete sem resultado, card ausente ou response Beefor >=400.

## Side Effects
IPC/Playwright Beefor, toasts Home, modal state.

## Dependencias
Shared Kudo types, clients IPC, ModalShell/common UI.

## Consumidores
Home e tray event.

## Testes
Sem teste especifico dos hooks Kudo.

## Observacoes / Dividas
Detalhe/listas usam alguns tipos com `unknown`/`any` no caminho de action.

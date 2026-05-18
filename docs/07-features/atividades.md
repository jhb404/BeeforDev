# Feature Atividades

> **Path:** `src/renderer/features/atividades/*`, `src/main/ipc/handlers/atividades.handlers.ts`
> **Responsabilidade em uma frase:** Exibir atividades/tarefas Beefor obtidas por HTTP autenticado.

## Responsabilidade
Renderer abre `AtividadesModal`, busca via `atividadesClient.fetch`, lista atividades e mostra detalhes em drawer com formatacao.

## API Publica
| Simbolo | Tipo | Descricao |
|---|---|---|
| `AtividadesModal` | component | Modal principal com split/lista/drawer. |
| `AtividadeList` | component | Lista selecionavel. |
| `AtividadeDrawer` | component | Detalhes da atividade. |
| `useResizeSplit` | hook | Persiste ratio em localStorage `beefor:ativ-split-ratio`. |
| `atividadeDisplay` | utils | Labels/icons, datas, esforco, fibonacci. |
| `mockInfoFor` | util | Dados mock derivados da atividade. |

## Fluxo Interno
Home abre modal; modal chama client; main handler usa token Beefor cacheado ou extrai via Playwright e faz GET `Quadro/ListarMinhasTarefas/{idPessoa}`.

## Erros e Edge Cases
- Sem token Beefor retorna `fail('Token Beefor nao disponivel...')`.
- Resize ratio clamp 0.25..0.75.
- Formatos extras do drawer usam mock quando backend nao entrega info rica.

## Side Effects
IPC, HTTP Beefor main, localStorage split ratio.

## Dependencias
Shared `BeeforAtividade`, UI modal/common.

## Consumidores
Home.

## Testes
Sem testes especificos.

## Observacoes / Dividas
Response raw do endpoint de tarefas nao e validada por schema runtime no main.

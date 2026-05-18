# Page Home

> **Path:** `src/renderer/pages/Home.tsx`, `src/renderer/pages/home/*`
> **Responsabilidade em uma frase:** Tela principal de mood, timesheet, resumo mensal e modais de Kudo/atividades.

## Responsabilidade
Home coordena status Beefor, settings, mood flow, timesheet data, lancamento de linhas, auto lancamento, view classica/minimal e abertura de modais.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `Home` | component | `(props?) => JSX.Element` | Pagina principal. |
| `useMoodFlow` | hook | `(deps) => {...}` | Carrega/seleciona mood e reporta toast. |
| `useTimesheetData` | hook | `(deps) => {...}` | Fetch/refresh de rows e sincronizacao apos notificacao. |
| `MinimalView` | component | props de rows/calendario | Visual minimalista calendario+dia. |
| `TimesheetGrid` | component memo | props rows/update/lancar | Grid classico de apontamentos. |
| `MoodPanel/MoodPicker` | components | props mood | UI de mood. |
| `SummaryStrip` | component | `{summary, compact}` | Total, saldo, media e melhor dia. |
| `TimesheetToolbar` | component | filtros/auto lancamento | Selecao ano/mes e actions. |
| `BatchConfirmModal` | component | confirmacao lote | Confirma lancamento mensal. |
| `rowState` | util | `buildEmpty`, `mergeFetched`, `rowStatusKind` | Modelo de linhas da Home. |

## Fluxo Interno
Home carrega settings, determina `ready = status === connected`, usa `useMoodFlow` e `useTimesheetData`, calcula summary com `workedMinutes`, e chama `timesheetClient.lancarHora` para cada linha.

## Erros e Edge Cases
- Se status desconectado, mostra estado sem sessao.
- Ao preencher `int1` de hoje, chama `onStartLunchTimer` se ainda nao havia valor.
- `bootReady` dispara quando desconectado ou quando mood/timesheet carregaram.
- `autoLancamento` mostra toast e reposiciona ano/mes atual em sucesso.

## Side Effects
IPC timesheet/mood/system/settings, toasts, audio UI, local state, app events para abrir Kudo.

## Dependencias
`useBeefor`, clients IPC, utils dates/timeMath/alarm, features kudo/atividades.

## Consumidores
`AppShell` renderiza Home lazy.

## Testes
`useMoodFlow.test.tsx`, `useTimesheetData.test.tsx`, `rowState` sem teste dedicado, `timeMath.test.ts` cobre calculo.

## Observacoes / Dividas
`showBatchModal` existe, mas nao ha botao visivel no trecho lido para abrir o modal de lote.

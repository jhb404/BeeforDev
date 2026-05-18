# Action Timesheet

> **Path:** `src/automation/beefor/actions/timesheet/*`
> **Responsabilidade em uma frase:** Ler, lancar e acionar auto lancamento de horas no Beefor.

## Responsabilidade
Timesheet tem caminho rapido por API Beefor usando token do localStorage e fallback por UI. Subarquivos separam navegacao, parse de payload, IO de linha, espera de responses e cache mensal.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `doAutoLancamento` | function | `(page) => Promise<void>` | Navega timesheet e clica Auto lancamento. |
| `doFetchTimesheet` | function | `(page,year,month) => Promise<FetchedRow[]>` | Tenta API rapida; fallback le linhas DOM. |
| `doLancarHora` | function | `(page,entry) => Promise<void>` | Tenta POST API; fallback preenche/salva linha DOM. |
| `doFetchTimesheetViaApi` | function | `(page,year,month) => Promise<FetchedRow[]>` | GET `BEEFOR_TIMESHEET_API/{year}/{month}`. |
| `doLancarHoraViaApi` | function | `(page,entry) => Promise<void>` | GET dia, POST apontamento, opcional POST comentario. |

## Fluxo Interno
```ascii
fetch
  -> doFetchTimesheetViaApi
      -> ensureBeeforOrigin
      -> page.evaluate(fetch GET apontamento)
      -> parse diasLancamento
  -> fallback UI: navigateTimesheet, selects ano/mes, ler rows

lancar
  -> doLancarHoraViaApi
      -> usa cache mensal se existir
      -> atualiza 6 apontamentos + comentario
      -> POST apontamento e comentario
      -> valida valores persistidos
  -> fallback UI: selecionar ano/mes/dia, preencher inputs, salvar, validar payload/reload
```

## Erros e Edge Cases
- API rapida falha -> warning e fallback UI.
- Linha com menos de 6 inputs lanca erro de DOM alterado.
- Campo disabled impede escrita.
- Persistencia divergente gera erro listando campos.
- `autoLancamento` espera response save/auto/timesheet; timeout cai para espera fixa curta.

## Side Effects
Fetches GET/POST em Beefor, cache mensal, clicks/preenchimento DOM, reload da pagina em validacao fallback.

## Dependencias
Selectors timesheet, constants, internals, logger e tipos shared.

## Consumidores
Timesheet handler e Home.

## Testes
Utils renderer de time math/row state tem testes; action sem teste.

## Observacoes / Dividas
`ACTION_LANCAR_HORA` usa runner sem reconnect; erro de sessao mid-run nao recebe retry automatico.

# Selectors

> **Path:** `src/automation/beefor/beeforSelectors.ts`
> **Responsabilidade em uma frase:** Centralizar seletores Beefor e fallback chains usados pelas actions Playwright.

## Responsabilidade
Actions nao devem espalhar seletores. Este arquivo agrupa login, app shell, auto lancamento, timesheet, KudoCard e mood.

## API Publica
| Grupo | Seletores/Funcoes | Uso |
|---|---|---|
| `login` | email/password inputs, textos de next/submit | `performLogin`. |
| `app` | indicadores logged-in, user menu, logout texts | `isLoggedIn`, `doLogout`. |
| `autoLancamento` | componente, texto do botao, CSS fallback | `doAutoLancamento`. |
| `timesheet` | root, selects, rows, inputs, save, comment | fetch/lancar UI fallback. |
| `kudoCard` | dialog, radios, autocomplete, textarea, card image | envio KudoCard. |
| `mood` | toggle group, toggles, active classes, svg map | select/current mood. |

## Fluxo Interno
Selectors usam fallback por estabilidade: texto/role, componentes Angular Material e CSS estrutural. Algumas entradas sao funcoes que interpolam mood ou slug de card.

## Erros e Edge Cases
- Mudanca de DOM Beefor deve ser corrigida aqui primeiro.
- `mood.activeClassByMood` e `svgIconToMood` tambem funcionam como mapeamento semantico.

## Side Effects
Nenhum.

## Dependencias
Nenhuma externa.

## Consumidores
Actions `session`, `mood`, `kudo`, `timesheet`.

## Testes
Sem teste automatizado.

## Observacoes / Dividas
Timesheet API rapida reduz dependencia de seletores, mas fallback UI ainda precisa deles.

# Internals

> **Path:** `src/automation/beefor/internals/*`, `src/automation/beefor/actions/timesheet/*`
> **Responsabilidade em uma frase:** Helpers internos de API, texto, cache e IO de timesheet.

## Responsabilidade
Internals evitam duplicacao entre actions. `beeforApi.ts` executa fetch autenticado dentro da pagina; `textUtils.ts` normaliza texto; `playwrightHelpers.ts` localiza elementos; `timesheetCache.ts` guarda payload mensal.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `ensureBeeforOrigin` | function | `(page) => Promise<void>` | Navega para `BEEFOR_URL` se necessario. |
| `beeforApiGet` | function | `(page,url) => Promise<T>` | Fetch no browser com token de `localStorage.user1`. |
| `getIdPessoa` | function | `(page) => Promise<string>` | Extrai idPessoa do `user1`. |
| `firstVisible` | function | `(page, selectors, timeout?) => Promise<Locator>` | Retorna primeiro seletor visivel. |
| `clickByAnyText` | function | `(page,texts,timeout?) => Promise<void>` | Clica primeiro botao por texto. |
| `normalizeUiText` | function | `(raw) => string` | Remove acentos, normaliza espacos e lower-case. |
| `canonicalMood` | function | `(raw) => Mood | null` | Resolve texto/classe para mood canonico. |
| `cacheMonthPayload` | function | `(year,month,payload) => void` | Guarda payload mensal timesheet. |
| `getCachedDayPayload` | function | `(year,month,day) => any|null` | Busca dia no cache mensal. |
| `replaceCachedDayPayload` | function | `(year,month,day,savedDay) => void` | Atualiza dia salvo no cache. |

## Fluxo Interno
Timesheet rapido usa `fetchApi.ts` para GET mes e popular cache; `lancarApi.ts` reutiliza dia cacheado, POSTa apontamento e comentario, valida persistencia e substitui cache.

## Erros e Edge Cases
- `getIdPessoa` lanca se `user1` ausente ou sem idPessoa.
- `firstVisible` lanca lista de seletores se nenhum aparecer ate timeout.
- `canonicalMood` tem fallback textual para `feliz`, `bom`, `triste`, `nao tao bom`.

## Side Effects
Fetches dentro da pagina Beefor, cache em memoria e navegacao para origem Beefor.

## Dependencias
- Internas: `shared/constants`, `shared/types`, selectors.
- Externas: Playwright.

## Consumidores
Actions mood, kudo, team e timesheet.

## Testes
Sem teste automatizado.

## Observacoes / Dividas
`normalizeUiText` contem regex de combinacao unicode; manter cuidado com encoding em edicoes futuras.

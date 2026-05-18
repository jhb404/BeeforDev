# Coverage

> **Path:** `vitest.config.ts`
> **Responsabilidade em uma frase:** Explicar escopo de coverage e lacunas conhecidas.

## Responsabilidade
Coverage atual coleta apenas areas selecionadas, nao o app inteiro.

## API Publica
| Include | Observacao |
|---|---|
| `src/main/ipc/**/*.{ts,tsx}` | Handlers/schemas/defineHandler. |
| `src/shared/**/*.{ts,tsx}` | Result/types/constants. |
| `src/renderer/app/hooks/**/*.{ts,tsx}` | Hooks globais app. |
| `src/renderer/pages/home/hooks/**/*.{ts,tsx}` | Hooks Home. |
| `src/renderer/features/coin2u/**/*.{ts,tsx}` | Feature Coin2U. |

## Fluxo Interno
Reporter `text` e `html`; provider `v8`. Exclui `*.test` e `*.spec`.

## Erros e Edge Cases
- Nao ha thresholds, entao coverage baixo nao falha CI por configuracao atual.
- Electron main runtime, Playwright e Coin2U main nao sao exercitados por testes unitarios.

## Side Effects
Relatorio HTML quando coverage e rodado.

## Dependencias
Vitest V8 coverage.

## Consumidores
Desenvolvedores.

## Testes
N/A.

## Observacoes / Dividas
Adicionar threshold minimo e expandir coverage para scheduler/session/coin2u main.

# Padroes de Testes

> **Path:** `src/**/*.test.ts(x)`, `src/test/*`
> **Responsabilidade em uma frase:** Documentar convencoes de teste observadas no repo.

## Responsabilidade
Testes ficam co-localizados ao arquivo testado quando possivel, usando jsdom e Testing Library para hooks/componentes.

## API Publica
| Padrao | Exemplo |
|---|---|
| Co-localizacao | `timeMath.ts` + `timeMath.test.ts` |
| Hooks React | `useLunchTimer.test.tsx`, `useTrayListeners.test.tsx` |
| Shared pure functions | `result.test.ts`, `dates.test.ts` |
| IPC schemas | `schemas.test.ts` |
| IPC helper | `defineHandler.test.ts` |
| Factories | `src/test/factories/ipc.ts` |

## Fluxo Interno
Mocks de IPC devem preferir `IpcProvider` com clients parciais em vez de tocar `window.beefor` global diretamente.

## Erros e Edge Cases
- Tests que dependem de timers devem controlar fake timers quando necessario.
- Hooks com listeners devem validar cleanup.

## Side Effects
Nenhum fora do runner.

## Dependencias
Vitest, Testing Library.

## Consumidores
Autores de novos testes.

## Testes
N/A.

## Observacoes / Dividas
Adicionar testes E2E Electron/Playwright se fluxos criticos forem automatizados em CI.

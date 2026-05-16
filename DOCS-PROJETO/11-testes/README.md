# Testes

> **Path:** `vitest.config.ts`, `src/test`, `src/**/*.test.ts(x)`
> **Responsabilidade em uma frase:** Documentar setup Vitest/jsdom e cobertura atual.

## Responsabilidade
Testes rodam com Vitest, ambiente jsdom, globals e setup global. Cobertura inclui main IPC, shared, hooks selecionados e feature Coin2U.

## API Publica
| Item | Valor |
|---|---|
| Runner | `vitest run` |
| Environment | `jsdom` |
| Setup | `src/test/setup.ts` |
| Include | `src/**/*.{test,spec}.{ts,tsx}`, `tests/**/*...` |
| Coverage provider | `v8` |
| Coverage reporter | text/html |

## Fluxo Interno
`npm test` executa suite. Factories em `src/test/factories/ipc.ts` ajudam mocks de clients.

## Erros e Edge Cases
- Sem threshold de coverage configurado.
- Automation/main Electron side effects tem pouca cobertura.

## Side Effects
Relatorio coverage se solicitado, jsdom globals.

## Dependencias
Vitest, Testing Library, jsdom.

## Consumidores
Desenvolvedores/CI.

## Testes
Este arquivo documenta a propria suite.

## Observacoes / Dividas
Rodar `npm test` e `npm run build` apos docs para validar que docs nao quebraram build.

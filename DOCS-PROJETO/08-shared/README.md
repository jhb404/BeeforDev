# Shared

> **Path:** `src/shared/`
> **Responsabilidade em uma frase:** Contratos compartilhados entre main, preload, automation e renderer.

## Responsabilidade
Shared contem canais IPC, tipos, constantes de URLs/keytar/files/timeouts e helpers `ActionResult`.

## API Publica
| Arquivo | Conteudo |
|---|---|
| `ipc/channels.ts` | `IPC`, `IpcChannel`. |
| `types/*` | AppSettings, sessao, timesheet, kudo, team, Coin2U, atividades, common. |
| `constants.ts` | URLs Beefor/Coin2U, keytar accounts, file names, timeouts. |
| `result.ts` | `ok`, `fail`, `withTimeout`, `getError`, `isErr`, `isOk`. |

## Fluxo Interno
Main e renderer importam tipos e constantes por aliases TS. `preload.ts` usa os mesmos tipos para expor API serializavel.

## Erros e Edge Cases
- `SETTINGS_FILE` e `beefor-settings.json`.
- URLs sao hardcoded para producao.

## Side Effects
Nenhum direto; helpers de result criam objetos/timers.

## Dependencias
Nenhuma externa em tipos/constants/result alem de TS runtime basico.

## Consumidores
Todo o app.

## Testes
`src/shared/result.test.ts`.

## Observacoes / Dividas
Multi-env ausente em constants e listado como divida em [../ARQUITETURA.md](../ARQUITETURA.md).

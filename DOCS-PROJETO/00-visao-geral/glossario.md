# Glossario

> **Path:** `src/shared/types/*`, `src/main/scheduler/*`, `src/automation/beefor/*`
> **Responsabilidade em uma frase:** Padronizar termos usados na documentacao e no codigo.

## Responsabilidade
Este glossario reduz ambiguidade entre termos de UI, Beefor, Coin2U, Playwright e scheduler.

## API Publica
| Termo | Definicao | Fonte |
|---|---|---|
| `mood` | Sentimento diario do Beefor: `Dia feliz`, `Dia bom`, `Dia nao tao bom`, `Dia triste`. | [`src/shared/types/mood.ts`](../../src/shared/types/mood.ts) |
| `kudo` / `KudoCard` | Cartao de reconhecimento enviado para pessoa ou time. | [`src/shared/types/kudo.ts`](../../src/shared/types/kudo.ts) |
| `punch` | Lembrete de ponto em quatro slots: entrada, saida almoco, retorno, saida. | [`src/main/scheduler/index.ts`](../../src/main/scheduler/index.ts) |
| `storageState` | Snapshot Playwright de cookies/localStorage do Beefor. | [`src/automation/beefor/beeforSession.ts`](../../src/automation/beefor/beeforSession.ts) |
| `drift` | Deslocamento deterministico por dia aplicado aos horarios de punch. | [`src/main/scheduler/drift.ts`](../../src/main/scheduler/drift.ts) |
| `fired state` | Lista em memoria dos eventos ja disparados no dia. | [`src/main/scheduler/firedState.ts`](../../src/main/scheduler/firedState.ts) |
| `pageLock` | Mutex serializando operacoes na unica Page Playwright. | [`src/automation/beefor/pageLock.ts`](../../src/automation/beefor/pageLock.ts) |
| `ActionResult<T>` | Contrato `{ ok: true, data } | { ok: false, error }`. | [`src/shared/types/common.ts`](../../src/shared/types/common.ts) |
| `AppSettings` | Configuracoes persistidas em JSON, exceto `patchJournal`. | [`src/shared/types/app.ts`](../../src/shared/types/app.ts) |
| `tray` | Icone/menu do sistema com acoes rapidas e eventos ao renderer. | [`src/main/bootstrap/tray.ts`](../../src/main/bootstrap/tray.ts) |

## Fluxo Interno
Termos de runtime aparecem em documentos de dominio: IPC em [../02-ipc/README.md](../02-ipc/README.md), automacao em [../03-automation-playwright/README.md](../03-automation-playwright/README.md), armazenamento em [../09-armazenamento/README.md](../09-armazenamento/README.md).

## Erros e Edge Cases
- `moodAlarm` e `moodNotification` coexistem; ambos entram no mesmo horario `moodNotificationTime`.
- `kudocardSchedule.ym` inclui `@HH:MM` quando ha horario fixo.
- `SESSION_FILE` e `SETTINGS_FILE` sao nomes de arquivo, nao caminhos absolutos.

## Side Effects
Nenhum; arquivo de referencia.

## Dependencias
- Internas: tipos compartilhados e scheduler.
- Externas: nenhuma.

## Consumidores
Toda a documentacao.

## Testes
Nao aplicavel.

## Observacoes / Dividas
A UI e alguns textos do codigo usam acentos e emojis; a documentacao usa ASCII quando nao precisa citar literal.

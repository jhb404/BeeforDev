# Utils Renderer

> **Path:** `src/renderer/utils/*`, feature utils
> **Responsabilidade em uma frase:** Funcoes puras/cache/audio usadas pela UI.

## Responsabilidade
Utils de datas, calculo de horas, caches locais, audio e formatacao de features.

## API Publica
| Arquivo | Exports |
|---|---|
| `dates.ts` | meses/dias PT, `pad2`, `isoDate`, `daysInMonth`, `weekdayOf`, `todayIso`, formatadores, `initialsOf`. |
| `timeMath.ts` | `toMinutes`, `formatMinutes`, `workedMinutes`. |
| `teamCache.ts` | load/save members, birthdays, merge. |
| `coin2uCache.ts` | assinatura e cache Coin2U. |
| `alarm.ts` | `playUiSound`, tipos de som/alarme e sintetizadores WebAudio. |
| `features/coin2u/utils/coin2uFormat.ts` | data, real, filtros member/item. |
| `features/atividades/utils/atividadeDisplay.ts` | labels, icons, datas e esforco. |
| `features/atividades/utils/atividadeMock.ts` | mock info complementar para atividade. |

## Fluxo Interno
Caches usam `localStorage` com parse defensivo; audio usa WebAudio no browser; timeMath calcula jornada por pares de horarios.

## Erros e Edge Cases
- Horarios vazios retornam 0 ou ignoram par incompleto.
- LocalStorage invalido deve cair para vazio/default nos caches.
- Audio pode falhar se navegador bloquear contexto; callers nao dependem de retorno.

## Side Effects
LocalStorage e audio.

## Dependencias
Tipos shared e Web APIs.

## Consumidores
Home, Team, Coin2U, Kudo, AppShell.

## Testes
`dates.test.ts`, `timeMath.test.ts`, `coin2uFormat.test.ts`.

## Observacoes / Dividas
`alarm.ts` e grande e concentra muitos sons; se crescer, fatiar por tipo.

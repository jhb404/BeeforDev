# Kudo Slot

> **Path:** `src/main/scheduler/schedulePersist.ts`, `src/main/scheduler/index.ts`
> **Responsabilidade em uma frase:** Gerar e persistir agenda mensal de lembretes KudoCard.

## Responsabilidade
`ensureKudocardSchedule` calcula dias uteis e horarios para o mes atual conforme `kudocardFrequency`, `kudocardDays` e `kudocardNotificationTime`.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `ensureKudocardSchedule` | function | `(settings) => Promise<Array<{day,time}>>` | Retorna schedule existente ou gera novo e salva settings. |

## Fluxo Interno
Se `kudocardSchedule.ym` coincide com `YYYY-M` e horario fixo opcional, retorna slots. Caso contrario, escolhe dias: `custom` filtra dias validos/uteis; `once`/`twice` sorteia dias uteis do mes. Horario fixo valido vence; senao sorteia 09:00..17:59.

## Erros e Edge Cases
- Dias custom fora do mes ou fim de semana sao descartados.
- `ym` inclui `@HH:MM` quando o horario fixo muda, forçando novo schedule.

## Side Effects
Salva `kudocardSchedule` em settings.

## Dependencias
`saveSettings`, `isWeekday`, logger.

## Consumidores
Scheduler tick e `getTodayAlerts`.

## Testes
Sem teste automatizado.

## Observacoes / Dividas
Schedule aleatorio usa `Math.random`; nao e deterministico entre geracoes quando settings mudam.

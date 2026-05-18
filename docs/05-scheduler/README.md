# Scheduler

> **Path:** `src/main/scheduler/`
> **Responsabilidade em uma frase:** Gerar alertas/notificacoes por tick de 30s com fired state diario.

## Responsabilidade
O scheduler le `AppSettings`, calcula horario atual, ignora fins de semana e dispara mood, lunch, KudoCard e punch reminders.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `startScheduler` | function | `(getWin) => void` | Executa tick imediato e setInterval 30s. |
| `stopScheduler` | function | `() => void` | Para timer. |
| `fireTestNotification` | function | `(win, kind) => void` | Disparo imediato para Settings. |
| `getTodayAlerts` | function | `() => Promise<TodayAlert[]>` | Lista alertas configurados para hoje. |

## Fluxo Interno
`tick` -> `loadSettings` -> `nowHHMM`/`isWeekend` -> checks mood/lunch/kudo/punch -> `notify` -> `markFired`.

## Erros e Edge Cases
- Falha em `loadSettings` loga erro e aborta tick.
- Sem window, tick retorna cedo.
- Fired state e em memoria e filtrado por `todayKey`.

## Side Effects
Timers, Notification nativa, eventos `evt:playAlarm` e `evt:notify`, persistencia de kudo schedule.

## Dependencias
Main window, settings store, notify, drift e schedulePersist.

## Consumidores
Bootstrap, system handler e renderer alerts.

## Testes
Sem teste main scheduler.

## Observacoes / Dividas
Punch automatico ainda e notificacao; codigo comenta que o clique real ficou para futuro.

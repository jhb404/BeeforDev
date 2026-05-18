# Alarmes

> **Path:** `src/main/scheduler/index.ts`, `src/main/scheduler/notify.ts`, `src/main/scheduler/alerts.ts`
> **Responsabilidade em uma frase:** Disparar notificacoes de mood e almoco e listar alertas do dia.

## Responsabilidade
Mood usa `moodNotification || moodAlarm` e horario `moodNotificationTime`; lunch usa `lunchAlarm` e `lunchAlarmTime`.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `notify` | function | `(win,title,body,withAlarm,kind?) => void` | Notification nativa + eventos renderer. |
| `getTodayAlerts` | function | `() => Promise<TodayAlert[]>` | Monta alertas visiveis na UI. |

## Fluxo Interno
No tick, se horario atual bate e `alreadyFired` e falso, notifica e marca. `notify` sempre envia `EVT_NOTIFY` e envia `EVT_PLAY_ALARM` quando `withAlarm` true.

## Erros e Edge Cases
- Fim de semana suprime mood/lunch/punch/kudo.
- Notification unsupported gera warning e ainda envia IPC para renderer.

## Side Effects
Notificacao OS, eventos IPC, fired state.

## Dependencias
`loadSettings`, `isWeekend`, `alreadyFired`, `markFired`.

## Consumidores
Scheduler tick e canal `NOTIFY_TEST`.

## Testes
Sem teste automatizado.

## Observacoes / Dividas
Textos de notificacao contem emojis no codigo; docs evitam reproduzir salvo quando necessario.

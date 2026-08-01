# Nomenclatura (glossário de UI)

> **Responsabilidade em uma frase:** Padronizar o texto visível do app com o vocabulário do Beefor.

## Regra

Quem usa o app é **prestador**: lança horas num timesheet, **não bate ponto**. Nenhum texto
visível pode falar em "ponto", "batida", "apontar ponto" ou "almoço". Nenhum lembrete pode
soar como se o app tivesse feito o apontamento sozinho — ele avisa, a pessoa lança.

Vocabulário canônico, tirado do i18n do goobeeteams
(`ClientApp/src/app/navigation/i18n/pt.ts` → `TIME_SHEET_BEEFOR`):

`Timesheet` · `Entrada` · `Int 1` (primeiro intervalo) · `Ret 1` (primeiro retorno) ·
`Int 2` · `Ret 2` · `Saída` · `Lançar Horas` · `Total Horas` · `Apontamentos`

## De → para

| Antes | Agora |
|---|---|
| AUTOMATIZAR BATIDA DE PONTO | Alerta de lançamento de horas (diário) |
| Ativar batida automática | Ativar alerta diário |
| Alerta ALMOÇO | 🍽️ Alerta de intervalo |
| Alarme de almoço / Horário do alarme | Alarme de intervalo / Horário do intervalo |
| Alerta AJUSTAR PONTOS (PJ) | Alerta de lançamento de horas (mensal) |
| Lembrete mensal para ajustar pontos | Lembrete mensal para lançamento de horas |
| Ponto, mood, almoço, KudoCard | Lançamento de horas, mood, intervalo, KudoCard |
| Timer de almoço | Timer de intervalo |
| Horas trabalhadas | Total de horas |
| Dias trabalhados | Dias apontados |
| Saldo do mês | Saldo de horas |
| Trabalhado (célula do dia) | Apontado |
| Entrada / Saída almoço / Retorno / Saída | Entrada / Int. 1 / Ret. 1 / Saída |
| 🧾 Ajustar Pontos (PJ) (notificação) | 🧾 Lançamento de horas |
| 🍽️ Hora do almoço (notificação) | 🍽️ Hora do intervalo |
| 🟢 Ponto — Entrada (notificação) | 🟢 Lançamento de horas — Entrada |
| "Bata seu primeiro ponto" (conquista) | "Lance suas primeiras horas" |
| XP "Bater ponto" | XP "Lançar horas" |

Ícones dos 4 horários: `🟢 Entrada · 🍽️ Int. 1 · 🔵 Ret. 1 · 🔴 Saída` — o intervalo leva o
de comida, igual ao Beefor. Fonte única em `scheduler/labels.ts` (main) e
`pages/settings/defaults.ts` (renderer).

## Padrão dos toggles

Todo alerta tem **um** switch, sempre `Ativar alerta …`:

| Card | Switch |
|---|---|
| PunchCard | Ativar alerta de lançamento de horas |
| PjCard | Ativar alerta mensal de lançamento de horas |
| LunchCard | Ativar alerta de intervalo |
| MoodCard | Ativar alerta de mood |
| KudoCardSettings | Ativar alerta de KudoCard |

Os mesmos rótulos valem no onboarding.

## Diário × mensal

Dois alertas diferentes compartilham "lançamento de horas", então o sufixo é obrigatório:

- **(diário)** — `PunchCard`, 4 horários, notifica no horário. Kind `punch`.
- **(mensal)** — `PjCard`, um dia fixo do mês, abre o `PjAlertModal`. Kind `pj`.

`useAlarmRouter` e `usePjAlert` decidem pelo `kind`; o fallback por título testa o diário
primeiro, porque só ele tem `"Lançamento de horas —"` com travessão.

## Removido

**`punchDriftMinutes` e `scheduler/drift.ts`** — a variação aleatória diária dos horários.
Fazia sentido quando a ideia era simular batida humana; num lembrete, só deixava o alerta
tocar em hora imprevisível.

**`moodAlarm`** — era o único alerta com o som separado da notificação ("Tocar alarme com a
notificação"). Todos os outros já chamam `notify(..., true, kind)`, ou seja, som sempre
junto. Mood passou a seguir o mesmo caminho e ficou com um switch só.

As duas chaves saíram de `AppSettings`, dos defaults e do `settingsSchema`.
`migrateSettings` (em `sessionStore.ts`) descarta ambas ao ler um arquivo antigo e promove
`moodAlarm: true` → `moodNotification: true`, pra quem tinha só o som ligado não perder o
aviso.

## Chaves internas mantidas

`automatePunch`, `punchTimes`, `lunchAlarm`, `lunchAlarmTime`, `pjAlarm`, os kinds de IPC
(`punch`/`lunch`/`pj`) e os nomes de arquivo/componente (`PunchCard`, `LunchCard`,
`LunchTimerWidget`) **não** mudaram. Renomear exigiria migração dos settings salvos e do
`firedState` sem ganho visível. A regra vale para texto de UI.

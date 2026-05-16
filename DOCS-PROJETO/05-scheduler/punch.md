# Punch

> **Path:** `src/main/scheduler/index.ts`, `src/main/scheduler/drift.ts`
> **Responsabilidade em uma frase:** Calcular e disparar lembretes de ponto com drift diario.

## Responsabilidade
Quando `automatePunch` esta ativo, cada horario em `punchTimes` recebe drift deterministico do dia e dispara notificacao se bater com `nowHHMM`.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `applyDailyDrift` | function | `(base,maxMin,slot) => string` | Aplica deslocamento em minutos dentro de 00:00..23:59. |

## Fluxo Interno
Seed = hash de `todayKey-slot`; drift = `seed % (2*max+1) - max`; soma ao horario base e clamp no dia.

## Erros e Edge Cases
- `maxMin` zero retorna base.
- Base invalida retorna base.
- Fired key e `punch-{idx}`, um disparo por slot/dia.

## Side Effects
Notificacao e eventos IPC; nenhum lancamento real no Beefor.

## Dependencias
`todayKey`, `notify`, fired state.

## Consumidores
Scheduler tick e `getTodayAlerts`.

## Testes
Sem teste automatizado.

## Observacoes / Dividas
Lacuna real: implementar batida de ponto automatica se esse for o comportamento esperado pelo nome `automatePunch`.

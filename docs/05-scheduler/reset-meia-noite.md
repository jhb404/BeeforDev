# Reset Meia-Noite

> **Path:** `src/main/scheduler/firedState.ts`, `src/main/scheduler/time.ts`
> **Responsabilidade em uma frase:** Garantir que eventos possam disparar novamente em novo dia.

## Responsabilidade
Nao ha job especifico de meia-noite; o reset ocorre preguiçosamente em `alreadyFired`, que filtra entradas cujo `date` nao e `todayKey()`.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `todayKey` | function | `() => string` | `YYYY-MM-DD` local. |
| `alreadyFired` | function | `(key) => boolean` | Filtra fired state para hoje e verifica chave. |
| `markFired` | function | `(key) => void` | Adiciona `{ key, date: todayKey() }`. |

## Fluxo Interno
A cada check, `alreadyFired` remove entries antigas antes de procurar a chave. Isso funciona porque tick roda a cada 30s.

## Erros e Edge Cases
- Fired state nao persiste entre reinicios; app reiniciado pode disparar novamente no mesmo dia.
- Timezone usa local do processo Electron.

## Side Effects
Mutacao de array em memoria.

## Dependencias
`time.ts`.

## Consumidores
Scheduler mood/lunch/kudo/punch.

## Testes
Sem teste automatizado.

## Observacoes / Dividas
Se idempotencia entre restarts for requisito, fired state precisa ir para disco/settings.

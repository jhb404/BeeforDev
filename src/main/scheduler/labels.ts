/**
 * Rótulos dos horários do alerta diário de lançamento de horas.
 *
 * Espelham a grade do timesheet e o i18n do Beefor (`Entrada`, `Int 1`, `Ret 1`,
 * `Saída`). O app é usado por prestador, que lança horas — não bate ponto — então
 * nenhuma string aqui pode falar em "ponto", "batida" ou "almoço".
 *
 * Duplicado de `renderer/pages/settings/defaults.ts` de propósito: main e renderer
 * não compartilham módulo de UI, e `shared/` é contrato de dados, não de texto.
 */
export const LANCAMENTO_LABELS = ['Entrada', 'Int. 1', 'Ret. 1', 'Saída'];

/** Ícone por horário — o intervalo leva o de comida. */
export const LANCAMENTO_ICONS = ['🟢', '🍽️', '🔵', '🔴'];

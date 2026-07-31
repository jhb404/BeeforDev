import type { MoodCalendarDia } from '@shared/types/index';

export interface NikoCell {
  /** null = célula de preenchimento antes do dia 1 (alinha o mês no dia da semana). */
  dia: number | null;
  info?: MoodCalendarDia;
}

/**
 * Monta as células do calendário Niko: padding até o dia da semana do dia 1,
 * depois um slot por dia do mês com o mood daquele dia (quando houver).
 *
 * `mes` é 1-12 (como a API), não 0-11 do `Date`.
 */
export function buildNikoGrid(ano: number, mes: number, dias: MoodCalendarDia[]): NikoCell[] {
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const primeiroDiaSemana = new Date(ano, mes - 1, 1).getDay();

  const porDia = new Map<number, MoodCalendarDia>();
  for (const d of dias) porDia.set(d.dia, d);

  const cells: NikoCell[] = [];
  for (let i = 0; i < primeiroDiaSemana; i++) cells.push({ dia: null });
  for (let d = 1; d <= diasNoMes; d++) cells.push({ dia: d, info: porDia.get(d) });
  return cells;
}

/** Dias com mood de verdade (1..4). Ausência (5) e sem registro (0) não contam. */
export function contarDiasMarcados(dias: MoodCalendarDia[]): number {
  return dias.filter((d) => d.sentimento >= 1 && d.sentimento <= 4).length;
}

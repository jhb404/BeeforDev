import { describe, expect, it } from 'vitest';
import type { MoodCalendarDia } from '@shared/types/index';
import { buildNikoGrid, contarDiasMarcados } from './nikoGrid';

function dia(d: number, sentimento: number): MoodCalendarDia {
  return {
    dia: d,
    sentimento,
    mood: null,
    dataCompleta: '',
    comentario: '',
    ausencia: sentimento === 5,
  };
}

describe('buildNikoGrid', () => {
  it('padding = dia da semana do dia 1 e um slot por dia do mês', () => {
    // 01/07/2026 é uma quarta-feira → 3 células de padding (Dom, Seg, Ter).
    const cells = buildNikoGrid(2026, 7, []);
    expect(cells.filter((c) => c.dia === null)).toHaveLength(3);
    expect(cells.filter((c) => c.dia !== null)).toHaveLength(31);
    expect(cells[3]?.dia).toBe(1);
    expect(cells.at(-1)?.dia).toBe(31);
  });

  it('sem padding quando o mês começa no domingo', () => {
    // 01/02/2026 é domingo.
    const cells = buildNikoGrid(2026, 2, []);
    expect(cells[0]?.dia).toBe(1);
    expect(cells.filter((c) => c.dia === null)).toHaveLength(0);
    expect(cells).toHaveLength(28);
  });

  it('respeita ano bissexto', () => {
    const cells = buildNikoGrid(2028, 2, []);
    expect(cells.filter((c) => c.dia !== null)).toHaveLength(29);
  });

  it('associa o mood ao dia certo', () => {
    const cells = buildNikoGrid(2026, 7, [dia(10, 1), dia(11, 4)]);
    const dez = cells.find((c) => c.dia === 10);
    const onze = cells.find((c) => c.dia === 11);
    expect(dez?.info?.sentimento).toBe(1);
    expect(onze?.info?.sentimento).toBe(4);
    expect(cells.find((c) => c.dia === 12)?.info).toBeUndefined();
  });
});

describe('contarDiasMarcados', () => {
  it('conta só sentimento 1..4 — ignora ausência e sem registro', () => {
    const dias = [dia(1, 1), dia(2, 4), dia(3, 5), dia(4, 0)];
    expect(contarDiasMarcados(dias)).toBe(2);
  });
});

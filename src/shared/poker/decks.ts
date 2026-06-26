/**
 * Catálogo de baralhos do Planning Poker. Compartilhado entre main (server) e
 * renderer (UI) — única fonte de verdade pra cartas válidas e cálculo de média.
 *
 * Cada deck define:
 *  - cards: ordem em que aparecem na UI (inclui `?` e `☕` por convenção)
 *  - numericValues: mapa de carta → valor numérico (omite cartas sem número)
 *    Decks puramente categóricos (T-Shirt) deixam este mapa vazio — a média
 *    fica `null` e a UI mostra só consenso/distribuição.
 */

export type DeckId = 'fib-mod' | 'fib' | 'powers' | 'tshirt' | 'linear';

export interface Deck {
  id: DeckId;
  label: string;
  description: string;
  cards: readonly string[];
  /** Carta → valor numérico (pra média). Carta ausente daqui sai do cálculo. */
  numericValues: Readonly<Record<string, number>>;
}

const NON_VOTE = ['?', '☕'] as const;

function numeric(entries: Array<[string, number]>): Record<string, number> {
  return Object.fromEntries(entries);
}

export const DECKS: readonly Deck[] = [
  {
    id: 'fib-mod',
    label: 'Fibonacci modificado',
    description: 'Clássico de Planning Poker — passos maiores em estimativas altas.',
    cards: ['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100', ...NON_VOTE],
    numericValues: numeric([
      ['0', 0],
      ['½', 0.5],
      ['1', 1],
      ['2', 2],
      ['3', 3],
      ['5', 5],
      ['8', 8],
      ['13', 13],
      ['20', 20],
      ['40', 40],
      ['100', 100],
    ]),
  },
  {
    id: 'fib',
    label: 'Fibonacci',
    description: 'Sequência de Fibonacci pura.',
    cards: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', ...NON_VOTE],
    numericValues: numeric([
      ['0', 0],
      ['1', 1],
      ['2', 2],
      ['3', 3],
      ['5', 5],
      ['8', 8],
      ['13', 13],
      ['21', 21],
      ['34', 34],
      ['55', 55],
      ['89', 89],
    ]),
  },
  {
    id: 'powers',
    label: 'Potências de 2',
    description: 'Bom pra estimar carga técnica que escala rápido.',
    cards: ['0', '1', '2', '4', '8', '16', '32', '64', ...NON_VOTE],
    numericValues: numeric([
      ['0', 0],
      ['1', 1],
      ['2', 2],
      ['4', 4],
      ['8', 8],
      ['16', 16],
      ['32', 32],
      ['64', 64],
    ]),
  },
  {
    id: 'tshirt',
    label: 'Tamanhos de camiseta',
    description: 'Estimativa qualitativa (XS → XXL). Sem média — usa consenso.',
    cards: ['XS', 'S', 'M', 'L', 'XL', 'XXL', ...NON_VOTE],
    numericValues: {},
  },
  {
    id: 'linear',
    label: 'Linear 0–10',
    description: 'Escala simples 0 a 10. Bom pra equipes novas em estimativa.',
    cards: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', ...NON_VOTE],
    numericValues: numeric([
      ['0', 0],
      ['1', 1],
      ['2', 2],
      ['3', 3],
      ['4', 4],
      ['5', 5],
      ['6', 6],
      ['7', 7],
      ['8', 8],
      ['9', 9],
      ['10', 10],
    ]),
  },
] as const;

export const DEFAULT_DECK_ID: DeckId = 'fib-mod';

export function getDeck(id: string | null | undefined): Deck {
  const found = DECKS.find((d) => d.id === id);
  return found ?? (DECKS.find((d) => d.id === DEFAULT_DECK_ID) as Deck);
}

/**
 * Resultado de uma rodada após `reveal`.
 * - average: média dos votos numéricos (null se nenhum voto numérico, ou deck sem números)
 * - distribution: pares [carta, contagem] ordenados por contagem desc, depois pela ordem do deck
 * - mode: carta mais votada (null se ninguém votou)
 * - consensus: 'full' (100%), 'strong' (≥80%), 'partial' (>50%) ou 'none'
 */
export interface RoundResults {
  average: number | null;
  distribution: Array<[string, number]>;
  mode: string | null;
  consensus: 'full' | 'strong' | 'partial' | 'none';
}

export function computeRoundResults(deck: Deck, votes: ReadonlyArray<string>): RoundResults {
  if (votes.length === 0) {
    return { average: null, distribution: [], mode: null, consensus: 'none' };
  }

  const counts = new Map<string, number>();
  for (const v of votes) counts.set(v, (counts.get(v) ?? 0) + 1);

  const orderIndex = new Map(deck.cards.map((c, i) => [c, i] as const));
  const distribution = Array.from(counts.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return (orderIndex.get(a[0]) ?? 99) - (orderIndex.get(b[0]) ?? 99);
  });

  const [topCard, topCount] = distribution[0];
  const ratio = topCount / votes.length;
  let consensus: RoundResults['consensus'] = 'none';
  if (ratio === 1) consensus = 'full';
  else if (ratio >= 0.8) consensus = 'strong';
  else if (ratio > 0.5) consensus = 'partial';

  // Média só considera cartas com valor numérico declarado no deck.
  const numericVotes = votes
    .map((v) => deck.numericValues[v])
    .filter((n): n is number => typeof n === 'number');
  const average =
    numericVotes.length > 0
      ? Math.round((numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length) * 10) / 10
      : null;

  return { average, distribution, mode: topCard, consensus };
}

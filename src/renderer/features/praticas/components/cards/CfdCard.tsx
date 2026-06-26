import type { CfdGrafico } from '@shared/types/index';
import { usePraticaCard } from '../../hooks/usePraticasData';
import { useDetalhes } from '../../hooks/useDetalhes';
import { BarChart } from '../charts/BarChart';
import { CardShell } from '../CardShell';
import { CardActions } from '../CardActions';
import type { CardProps } from './registry';

/** CFD simplificado: total acumulado por série (coluna). Versão SVG sem stacked area. */
export function CfdCard({ chave, idTime, nome }: CardProps) {
  const { data, loading, error } = usePraticaCard<CfdGrafico>(chave, idTime);
  const det = useDetalhes();
  // agrupa pontos por série, soma valores
  const porSerie = new Map<string, number>();
  for (const p of data?.pontos ?? []) porSerie.set(p.serie, (porSerie.get(p.serie) ?? 0) + p.valor);
  const barras = [...porSerie.entries()].map(([legenda, valor]) => ({ legenda, valor }));
  return (
    <CardShell
      titulo={nome || 'Gráfico CFD'}
      chave={chave}
      loading={loading}
      error={error}
      vazio={!barras.length}
    >
      <BarChart data={barras} />
      <small className="praticas-legend">Acumulado por coluna</small>
      <CardActions onDetails={() => det.open(`${nome || 'Gráfico CFD'} — detalhes`)} />
      {det.node}
    </CardShell>
  );
}

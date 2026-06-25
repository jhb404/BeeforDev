import type { ThroughputGrafico } from '@shared/types/index';
import { usePraticaCard } from '../../hooks/usePraticasData';
import { useDetalhes } from '../../hooks/useDetalhes';
import { BarChart } from '../charts/BarChart';
import { CardShell } from '../CardShell';
import { CardActions } from '../CardActions';
import type { CardProps } from './registry';

export function ThroughputCard({ chave, idTime, nome }: CardProps) {
  const { data, loading, error } = usePraticaCard<ThroughputGrafico>(chave, idTime);
  const det = useDetalhes();
  const meta = data?.periodos?.length
    ? Math.max(...data.periodos.map((p) => p.planejado))
    : undefined;
  return (
    <CardShell
      titulo={nome || 'Throughput'}
      temperatura={data?.temperatura}
      loading={loading}
      error={error}
      vazio={!data?.periodos?.length}
    >
      {data && <p className="praticas-card-sub">Média de entrega: {data.mediaEntrega || '—'}</p>}
      <BarChart
        data={(data?.periodos ?? []).map((p) => ({ legenda: p.nome, valor: p.entregue }))}
        meta={meta}
      />
      <small className="praticas-legend">Barras: entregue · tracejado: planejado</small>
      <CardActions onDetails={() => det.open('Throughput — detalhes')} />
      {det.node}
    </CardShell>
  );
}

import type { CycleTimeGrafico, LeadTimeGrafico } from '@shared/types/index';
import { usePraticaCard } from '../../hooks/usePraticasData';
import { useDetalhes } from '../../hooks/useDetalhes';
import { BarChart } from '../charts/BarChart';
import { CardShell } from '../CardShell';
import { CardActions } from '../CardActions';
import type { CardProps } from './registry';

/** Serve Cycle Time e Lead Time (mesmo shape: valor + barra Top10). */
export function CycleTimeCard({ chave, idTime, nome }: CardProps) {
  const { data, loading, error } = usePraticaCard<CycleTimeGrafico | LeadTimeGrafico>(
    chave,
    idTime,
  );
  const det = useDetalhes();
  return (
    <CardShell
      titulo={nome || 'Cycle Time'}
      chave={chave}
      loading={loading}
      error={error}
      vazio={!data?.barra?.pontos?.length && data?.valor == null}
    >
      {data?.valor != null && (
        <p className="praticas-card-sub">
          Média atual: <strong>{data.valor}</strong> dias
        </p>
      )}
      <BarChart data={data?.barra?.pontos ?? []} unidade="d" />
      <small className="praticas-legend">{data?.barra?.label ?? 'dias'}</small>
      <CardActions onDetails={() => det.open(`${nome || 'Cycle Time'} — detalhes`)} />
      {det.node}
    </CardShell>
  );
}

import type { RecomendacoesGrafico } from '@shared/types/index';
import { usePraticaCard } from '../../hooks/usePraticasData';
import { PieChart } from '../charts/PieChart';
import { CardShell } from '../CardShell';
import type { CardProps } from './registry';

/** Recomendações (ex-Dicas do Agile Coach) — donut aceitas/rejeitadas/pendentes. */
export function RecomendacoesCard({ chave, idTime, nome }: CardProps) {
  const { data, loading, error } = usePraticaCard<RecomendacoesGrafico>(chave, idTime);
  const fatias = data
    ? [
        { rotulo: 'Aceitas', valor: data.aceitas },
        { rotulo: 'Rejeitadas', valor: data.rejeitadas },
        { rotulo: 'Pendentes', valor: data.pendentes },
      ].filter((f) => f.valor > 0)
    : [];
  return (
    <CardShell
      titulo={nome || 'Recomendações'}
      temperatura={data?.temperatura}
      loading={loading}
      error={error}
      vazio={!data || data.total === 0}
    >
      <PieChart data={fatias} cores={['#42d6a4', '#e5484d', '#888']} />
      {data && (
        <small className="praticas-legend">
          {data.aceitas} de {data.total} recomendações aceitas
        </small>
      )}
    </CardShell>
  );
}

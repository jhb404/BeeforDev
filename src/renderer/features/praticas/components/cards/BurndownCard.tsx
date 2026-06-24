import type { BurndownGrafico } from '@shared/types/index';
import { usePraticaCard } from '../../hooks/usePraticasData';
import { LineChart } from '../charts/LineChart';
import { CardShell } from '../CardShell';
import type { CardProps } from './registry';

export function BurndownCard({ chave, idTime, nome }: CardProps) {
  const { data, loading, error } = usePraticaCard<BurndownGrafico>(chave, idTime);
  const serie = data?.series?.[0];
  return (
    <CardShell
      titulo={nome || 'Progresso da Sprint'}
      temperatura={data?.temperatura}
      loading={loading}
      error={error}
      vazio={!serie?.real?.length}
    >
      {data && (
        <p className="praticas-card-sub">
          {data.totalCards} cards · {Math.round(data.porcentagemEntregueDiasUteis)}% concluído
        </p>
      )}
      {serie && <LineChart legenda={serie.legenda} serie={serie.real} baseline={serie.ideal} />}
      <small className="praticas-legend">Linha: real · tracejado: ideal</small>
    </CardShell>
  );
}

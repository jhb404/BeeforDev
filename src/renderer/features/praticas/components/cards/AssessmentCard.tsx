import type { AssessmentRadar } from '@shared/types/index';
import { usePraticaCard } from '../../hooks/usePraticasData';
import { RadarChart } from '../charts/RadarChart';
import { CardShell } from '../CardShell';
import type { CardProps } from './registry';

export function AssessmentCard({ chave, idTime, nome }: CardProps) {
  const { data, loading, error } = usePraticaCard<AssessmentRadar>(chave, idTime);
  // média dos eixos por competência → 1 ponto por competência no radar
  const eixos = (data?.competencias ?? []).map((c) => ({
    rotulo: c.competencia,
    valor: c.eixos.length ? c.eixos.reduce((s, e) => s + e.valor, 0) / c.eixos.length : 0,
  }));
  return (
    <CardShell
      titulo={nome || 'Assessment'}
      loading={loading}
      error={error}
      vazio={eixos.length < 3}
    >
      <RadarChart eixos={eixos} />
    </CardShell>
  );
}

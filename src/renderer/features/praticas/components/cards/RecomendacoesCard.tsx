import { useState } from 'react';
import type { RecomendacoesGrafico } from '@shared/types/index';
import { usePraticaCard } from '../../hooks/usePraticasData';
import { PieChart } from '../charts/PieChart';
import { CardShell } from '../CardShell';
import { CardActions } from '../CardActions';
import { ConfigModal } from '../ConfigModal';
import type { CardProps } from './registry';

/** Recomendações (ex-Dicas do Agile Coach) — donut aceitas/rejeitadas/pendentes. */
export function RecomendacoesCard({ chave, idTime, nome }: CardProps) {
  const { data, loading, error } = usePraticaCard<RecomendacoesGrafico>(chave, idTime);
  const [modal, setModal] = useState<string | null>(null);
  const fatias = data
    ? [
        { rotulo: 'Aceitas', valor: data.aceitas, cor: 'var(--ok-fill)' },
        { rotulo: 'Rejeitadas', valor: data.rejeitadas, cor: 'var(--err-fill)' },
        { rotulo: 'Pendentes', valor: data.pendentes, cor: 'var(--text-muted)' },
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
      <PieChart data={fatias} />
      {data && (
        <small className="praticas-legend">
          {data.aceitas} de {data.total} recomendações aceitas
        </small>
      )}
      <CardActions
        onAdd={() => setModal('Adicionar recomendação')}
        onDetails={() => setModal('Recomendações')}
      />
      {modal && <ConfigModal titulo={modal} valor="" onClose={() => setModal(null)} />}
    </CardShell>
  );
}

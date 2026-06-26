import { useState } from 'react';
import type { MelhoriaContinuaGrafico } from '@shared/types/index';
import { usePraticaCard } from '../../hooks/usePraticasData';
import { PieChart } from '../charts/PieChart';
import { CardShell } from '../CardShell';
import { CardActions } from '../CardActions';
import { ConfigModal } from '../ConfigModal';
import type { CardProps } from './registry';

export function MelhoriaContinuaCard({ chave, idTime, nome }: CardProps) {
  const { data, loading, error } = usePraticaCard<MelhoriaContinuaGrafico>(chave, idTime);
  const [modal, setModal] = useState<string | null>(null);
  // sem cor do backend → PieChart usa a paleta --chart-* do tema (reage ao preset)
  const fatias = (data?.fatias ?? []).map((f) => ({
    rotulo: f.rotulo,
    valor: f.valor,
  }));
  const temDados = fatias.some((f) => f.valor > 0);

  return (
    <CardShell
      titulo={nome || 'Melhoria Contínua'}
      chave={chave}
      temperatura={data?.temperatura}
      loading={loading}
      error={error}
      vazio={!temDados}
    >
      <PieChart data={fatias} />
      {data && data.total > 0 && (
        <small className="praticas-legend">
          {data.concluidas} de {data.total} já foram implementadas.
        </small>
      )}
      <CardActions
        onAdd={() => setModal('Adicionar Melhoria')}
        onDetails={() => setModal('Melhorias Contínuas')}
      />
      {modal && <ConfigModal titulo={modal} valor="" onClose={() => setModal(null)} />}
    </CardShell>
  );
}

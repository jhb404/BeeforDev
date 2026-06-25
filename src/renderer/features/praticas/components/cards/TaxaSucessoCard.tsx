import { useState } from 'react';
import type { TaxaSucessoGrafico } from '@shared/types/index';
import { usePraticaCard } from '../../hooks/usePraticasData';
import { Gauge } from '../charts/Gauge';
import { CardShell } from '../CardShell';
import { CardActions } from '../CardActions';
import { ConfigModal } from '../ConfigModal';
import type { CardProps } from './registry';

export function TaxaSucessoCard({ chave, idTime, nome }: CardProps) {
  const { data, loading, error } = usePraticaCard<TaxaSucessoGrafico>(chave, idTime);
  const [modal, setModal] = useState<string | null>(null);
  return (
    <CardShell
      titulo={nome || 'Taxa Sucesso Planning'}
      chave={chave}
      temperatura={data?.temperatura}
      loading={loading}
      error={error}
    >
      <Gauge valor={data?.taxa ?? null} color="var(--ok-fill)" />
      <small className="praticas-legend">
        Média de objetivos de valor realizado de todas as entregas
      </small>
      <CardActions
        onEdit={() => setModal('Editar Taxa de Sucesso')}
        onDetails={() => setModal('Taxa de Sucesso — detalhes')}
      />
      {modal && <ConfigModal titulo={modal} valor="" onClose={() => setModal(null)} />}
    </CardShell>
  );
}

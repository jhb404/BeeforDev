import { useState } from 'react';
import type { CerimoniaInfo } from '@shared/types/index';
import { usePraticaCard } from '../../hooks/usePraticasData';
import { CardShell } from '../CardShell';
import { CardActions } from '../CardActions';
import { ConfigModal } from '../ConfigModal';
import type { CardProps } from './registry';

function dt(s: string): string {
  if (!s) return '—';
  const d = s.slice(0, 10);
  const [y, m, day] = d.split('-');
  return y && m && day ? `${day}/${m}/${y}` : d;
}

/** Planning / Review — progresso + Onde + atraso + Add/Detalhes/Editar. */
export function CerimoniaCard({ chave, idTime, nome }: CardProps) {
  const { data, loading, error } = usePraticaCard<CerimoniaInfo>(chave, idTime);
  const [modal, setModal] = useState<string | null>(null);
  const isReview = chave === 'REVIEW';

  // Review atrasada: diasRestantes negativo
  const atrasada = isReview && data?.diasRestantes != null && data.diasRestantes < 0;
  const statusReview =
    isReview && data?.diasRestantes != null
      ? atrasada
        ? `A review está atrasada em ${Math.abs(data.diasRestantes)} dia(s)`
        : data.diasRestantes === 0
          ? 'Hoje é o dia da review'
          : `Faltam ${data.diasRestantes} dia(s) para a review`
      : null;

  return (
    <CardShell
      titulo={nome || data?.titulo || 'Cerimônia'}
      temperatura={data?.temperatura}
      loading={loading}
      error={error}
      vazio={!data}
    >
      <p className="praticas-cerimonia-titulo">{data?.legendaPercent || 'Trabalho em progresso'}</p>

      {/* Planning: barra progresso com "N dias" */}
      {!isReview && data?.percent != null && (
        <div className="praticas-progress">
          <div className="praticas-progress-fill" style={{ width: `${data.percent}%` }}>
            {data.diasRestantes != null && (
              <span>
                {data.diasRestantes} dia{data.diasRestantes === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Review: status de atraso */}
      {statusReview && (
        <p className={`praticas-cerimonia-status${atrasada ? ' atrasada' : ''}`}>{statusReview}</p>
      )}

      {data?.onde && (
        <label className="praticas-field">
          <span>Onde?</span>
          <input type="text" value={data.onde} readOnly />
        </label>
      )}

      <p className="praticas-cerimonia-contador">
        <strong>{data?.quantidade ?? 0}</strong> {(data?.titulo ?? '').toLowerCase()}(s)
        realizada(s)
      </p>

      <div className="praticas-cerimonia-datas">
        <span>Última: {dt(data?.ultimaData ?? '')}</span>
        <span>Próxima: {dt(data?.proximaData ?? '')}</span>
      </div>

      <CardActions
        onAdd={() => setModal(`Adicionar ${data?.titulo}`)}
        onEdit={() => setModal(`Editar ${data?.titulo}`)}
        onDetails={() => setModal(`Histórico de ${data?.titulo}`)}
      />
      {modal && <ConfigModal titulo={modal} valor="" onClose={() => setModal(null)} />}
    </CardShell>
  );
}

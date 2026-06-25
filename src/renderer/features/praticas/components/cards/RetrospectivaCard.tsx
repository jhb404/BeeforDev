import { useState } from 'react';
import type { CerimoniaInfo } from '@shared/types/index';
import { usePraticaCard } from '../../hooks/usePraticasData';
import { Gauge } from '../charts/Gauge';
import { CardShell } from '../CardShell';
import { CardActions } from '../CardActions';
import type { CardProps } from './registry';

function dt(s: string): string {
  if (!s) return '—';
  const d = s.slice(0, 10);
  const [y, m, day] = d.split('-');
  return y && m && day ? `${day}/${m}/${y}` : d;
}

/** Retrospectiva — donut % melhorias + Onde + contador + Add/Detalhes/Editar. */
export function RetrospectivaCard({ chave, idTime, nome }: CardProps) {
  const { data, loading, error } = usePraticaCard<CerimoniaInfo>(chave, idTime);
  const [modal, setModal] = useState<string | null>(null);

  return (
    <CardShell
      titulo={nome || 'Retrospectiva'}
      temperatura={data?.temperatura}
      loading={loading}
      error={error}
      vazio={!data}
    >
      <div className="praticas-card-center">
        {data?.percent != null && (
          <Gauge valor={data.percent} label={data.legendaPercent} color="var(--warm)" />
        )}

        <p className="praticas-cerimonia-contador">
          <strong>{data?.quantidade ?? 0}</strong> retrospectiva(s) realizada(s)
        </p>
      </div>

      {/* bloco inferior fixo — Onde + datas no mesmo lugar em Planning/Review/Retro */}
      <div className="praticas-cerimonia-foot">
        {data?.onde && (
          <label className="praticas-field">
            <span>Onde?</span>
            <input type="text" value={data.onde} readOnly />
          </label>
        )}

        <div className="praticas-cerimonia-datas">
          <span>Última: {dt(data?.ultimaData ?? '')}</span>
          <span>Próxima: {dt(data?.proximaData ?? '')}</span>
        </div>
      </div>

      <CardActions
        onAdd={() => setModal('Adicionar Retrospectiva')}
        onEdit={() => setModal('Editar configuração da Retrospectiva')}
        onDetails={() => setModal('Histórico de Retrospectivas')}
      />

      {modal && (
        <div className="praticas-modal-overlay" onClick={() => setModal(null)}>
          <div className="praticas-modal" onClick={(e) => e.stopPropagation()}>
            <header className="praticas-modal-head">
              <h3>{modal}</h3>
              <button type="button" className="praticas-modal-close" onClick={() => setModal(null)}>
                ×
              </button>
            </header>
            <div className="praticas-modal-body">
              <p className="praticas-card-sub">Configuração e histórico completos no Beefor web.</p>
            </div>
          </div>
        </div>
      )}
    </CardShell>
  );
}

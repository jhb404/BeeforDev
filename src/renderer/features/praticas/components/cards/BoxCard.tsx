import type { BoxResumo } from '@shared/types/index';
import { usePraticaCard } from '../../hooks/usePraticasData';
import { CardShell } from '../CardShell';
import type { CardProps } from './registry';

/** Capacity, Movimento, Delegation Board, Dicas Agile Coach, Gestão Backlog. */
export function BoxCard({ chave, idTime, nome }: CardProps) {
  const { data, loading, error } = usePraticaCard<BoxResumo>(chave, idTime);
  return (
    <CardShell
      titulo={nome || data?.titulo || '—'}
      temperatura={data?.temperatura}
      loading={loading}
      error={error}
      vazio={!data}
    >
      <div className="praticas-box">
        <span className="praticas-box-valor">{data?.valorPrincipal ?? '—'}</span>
        {data?.sub && <span className="praticas-box-sub">{data.sub}</span>}
        {data?.valorSecundario && <span className="praticas-box-sec">{data.valorSecundario}</span>}
      </div>
    </CardShell>
  );
}

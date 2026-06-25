import type { BoxResumo } from '@shared/types/index';
import { usePraticaCard } from '../../hooks/usePraticasData';
import { useDetalhes } from '../../hooks/useDetalhes';
import { CardShell } from '../CardShell';
import { CardActions } from '../CardActions';
import type { CardProps } from './registry';

/** Gestão de Backlog e outros boxes-resumo simples. */
export function BoxCard({ chave, idTime, nome }: CardProps) {
  const { data, loading, error } = usePraticaCard<BoxResumo>(chave, idTime);
  const det = useDetalhes();
  return (
    <CardShell
      titulo={nome || data?.titulo || '—'}
      temperatura={data?.temperatura}
      loading={loading}
      error={error}
      vazio={!data}
    >
      <div className="praticas-card-center">
        <div className="praticas-box">
          <span className="praticas-box-valor">{data?.valorPrincipal ?? '—'}</span>
          {data?.sub && <span className="praticas-box-sub">{data.sub}</span>}
          {data?.valorSecundario && (
            <span className="praticas-box-sec">{data.valorSecundario}</span>
          )}
        </div>
      </div>
      <CardActions onDetails={() => det.open(`${nome || data?.titulo || 'Detalhes'} — detalhes`)} />
      {det.node}
    </CardShell>
  );
}

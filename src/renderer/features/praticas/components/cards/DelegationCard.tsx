import { useState } from 'react';
import type { BoxResumo } from '@shared/types/index';
import { usePraticaCard } from '../../hooks/usePraticasData';
import { CardShell } from '../CardShell';
import { CardActions } from '../CardActions';
import { ConfigModal } from '../ConfigModal';
import type { CardProps } from './registry';

const NIVEIS = [
  '',
  'Dizer',
  'Vender',
  'Consultar',
  'Concordar',
  'Aconselhar',
  'Perguntar',
  'Delegar',
];

/** Delegation Board — nível médio de autoridade (1..7) + domínios. */
export function DelegationCard({ chave, idTime, nome }: CardProps) {
  const { data, loading, error } = usePraticaCard<BoxResumo>(chave, idTime);
  const [modal, setModal] = useState<string | null>(null);

  const nivel = Math.round(parseFloat(String(data?.valorPrincipal ?? '0').replace(',', '.')));
  const nivelLabel = NIVEIS[nivel] ?? '';
  const dominios = data?.valorSecundario ?? '';

  return (
    <CardShell
      titulo={nome || 'Delegation Board'}
      chave={chave}
      temperatura={data?.temperatura}
      loading={loading}
      error={error}
      vazio={!data}
    >
      <div className="praticas-card-center">
        <div className="praticas-deleg">
          <div className="praticas-deleg-nivel">
            <span className="praticas-deleg-num">{nivel || '—'}</span>
            {nivelLabel && <span className="praticas-deleg-label">{nivelLabel}</span>}
          </div>
          <div className="praticas-deleg-escala" aria-hidden>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <span key={n} className={`praticas-deleg-dot${n <= nivel ? ' on' : ''}`} />
            ))}
          </div>
        </div>
        <p className="praticas-card-sub praticas-deleg-sub">
          Nível médio de autoridade do time
          {dominios && (
            <>
              <br />
              <strong>{dominios}</strong> domínios configurados
            </>
          )}
        </p>
      </div>

      <CardActions
        onAdd={() => setModal('Adicionar domínio')}
        onDetails={() => setModal('Delegation Board')}
      />
      {modal && <ConfigModal titulo={modal} valor="" onClose={() => setModal(null)} />}
    </CardShell>
  );
}

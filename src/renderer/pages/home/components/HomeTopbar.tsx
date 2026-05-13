import type { SessionStatus } from '@shared/types';
import { StatusBadge } from '../../../components/common/StatusBadge';

interface HomeTopbarProps {
  status: SessionStatus;
  busy: boolean;
  loadingMood: boolean;
  loadingTs: boolean;
  ready: boolean;
  onReload: () => void;
  onOpenBeefor: () => void;
  onOpenKudo: () => void;
  onOpenKudoHistory: () => void;
}

export function HomeTopbar({
  status,
  busy,
  loadingMood,
  loadingTs,
  ready,
  onReload,
  onOpenBeefor,
  onOpenKudo,
  onOpenKudoHistory,
}: HomeTopbarProps) {
  const showReload =
    status === 'error' || status === 'expired' || status === 'disconnected';
  return (
    <section className="home-topbar">
      <div>
        <p className="eyebrow">Beefor U</p>
        <h1>Lançamento de horas</h1>
      </div>
      <div className="home-status">
        <StatusBadge status={status} />
        {showReload && (
          <button
            className="secondary compact"
            disabled={busy || loadingTs || loadingMood}
            onClick={onReload}
          >
            Recarregar
          </button>
        )}
        <button className="secondary compact" onClick={onOpenBeefor}>
          Abrir Beefor
        </button>
        <button
          data-sound="kudo-open"
          className="secondary compact"
          disabled={busy || !ready}
          onClick={onOpenKudo}
        >
          Enviar KudoCard
        </button>
        <button
          data-sound="journal"
          className="secondary compact"
          disabled={busy || !ready}
          onClick={onOpenKudoHistory}
        >
          Histórico KudoCards
        </button>
      </div>
    </section>
  );
}

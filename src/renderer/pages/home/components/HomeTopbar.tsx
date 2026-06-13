import { useRef, useState } from 'react';
import type { SessionStatus } from '@shared/types/index';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface HomeTopbarProps {
  status: SessionStatus;
  busy: boolean;
  loadingMood: boolean;
  loadingTs: boolean;
  ready: boolean;
  onReload: () => void;
  onOpenKudo: () => void;
  onOpenKudoHistory: () => void;
  onOpenAtividades: () => void;
}

export function HomeTopbar({
  status,
  busy,
  loadingMood,
  loadingTs,
  ready,
  onReload,
  onOpenKudo,
  onOpenKudoHistory,
  onOpenAtividades,
}: HomeTopbarProps) {
  const showReload = status === 'error' || status === 'expired' || status === 'disconnected';
  const [kudoOpen, setKudoOpen] = useState(false);
  const kudoRef = useRef<HTMLDivElement>(null);
  useClickOutside(kudoRef, () => setKudoOpen(false));

  return (
    <section className="home-topbar">
      <div className="home-topbar__left">
        <div>
          <h1>Meu Board</h1>
        </div>
        {showReload && (
          <button
            className="secondary compact"
            disabled={busy || loadingTs || loadingMood}
            onClick={onReload}
            title="Tentar reconectar"
          >
            ↺ Reconectar
          </button>
        )}
      </div>
      <div className="home-status">
        <button
          data-sound="activity-open"
          className="secondary compact"
          disabled={busy || !ready}
          onClick={onOpenAtividades}
        >
          Atividades
        </button>

        <div className="topbar-kudo-wrap" ref={kudoRef}>
          <div className="topbar-kudo-split">
            <button
              data-sound="kudo-open"
              className="secondary compact topbar-kudo-main"
              disabled={busy || !ready}
              onClick={onOpenKudo}
              title="Enviar KudoCard"
            >
              KudoCard
            </button>
            <button
              data-sound="tab-home"
              className="secondary compact topbar-kudo-chevron"
              disabled={busy || !ready}
              onClick={() => setKudoOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={kudoOpen}
              aria-label="Mais opções KudoCard"
            >
              <svg
                width="9"
                height="9"
                viewBox="0 0 10 10"
                fill="currentColor"
                aria-hidden="true"
                style={{
                  transform: kudoOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform .12s',
                }}
              >
                <path
                  d="M1 3l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          {kudoOpen && (
            <div className="topbar-kudo-menu" role="menu">
              <button
                role="menuitem"
                data-sound="journal"
                onClick={() => {
                  setKudoOpen(false);
                  onOpenKudoHistory();
                }}
              >
                Histórico de Kudos
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

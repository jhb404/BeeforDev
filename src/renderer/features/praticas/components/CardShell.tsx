import { useState, type ReactNode } from 'react';
import { TemperaturaBadge } from './TemperaturaBadge';
import type { Temperatura } from '@shared/types/index';
import { AJUDA_PRATICAS } from '../praticasAjuda';

interface CardShellProps {
  titulo: string;
  /** chave da prática — resolve o texto de ajuda do modal "?". */
  chave?: string;
  /** sobrescreve o texto de ajuda (senão usa AJUDA_PRATICAS[chave]). */
  ajuda?: ReactNode;
  temperatura?: Temperatura | null;
  loading?: boolean;
  error?: string | null;
  vazio?: boolean;
  children: ReactNode;
}

/** Moldura comum dos cards de prática: header + "?" de ajuda + estados loading/erro/vazio. */
export function CardShell({
  titulo,
  chave,
  ajuda,
  temperatura,
  loading,
  error,
  vazio,
  children,
}: CardShellProps) {
  const [ajudaOpen, setAjudaOpen] = useState(false);
  const conteudoAjuda = ajuda ?? (chave ? AJUDA_PRATICAS[chave] : undefined);

  return (
    <div className="card praticas-card">
      <header className="praticas-card-head">
        <div className="praticas-card-head-title">
          <h3>{titulo}</h3>
          <button
            type="button"
            className="praticas-card-help"
            onClick={() => setAjudaOpen(true)}
            aria-label={`Sobre ${titulo}`}
            title={`Sobre ${titulo}`}
          >
            ?
          </button>
        </div>
        {temperatura != null && <TemperaturaBadge temperatura={temperatura} />}
      </header>
      <div className="praticas-card-body">
        {loading ? (
          <div className="praticas-loading">Carregando…</div>
        ) : error ? (
          <div className="praticas-error">{error}</div>
        ) : vazio ? (
          <div className="praticas-chart-empty">Sem dados.</div>
        ) : (
          children
        )}
      </div>

      {ajudaOpen && (
        <div className="praticas-modal-overlay" onClick={() => setAjudaOpen(false)}>
          <div className="praticas-modal" onClick={(e) => e.stopPropagation()}>
            <header className="praticas-modal-head">
              <h3>{titulo}</h3>
              <button
                type="button"
                className="praticas-modal-close"
                onClick={() => setAjudaOpen(false)}
              >
                ×
              </button>
            </header>
            <div className="praticas-modal-body">
              {conteudoAjuda ? (
                <p className="praticas-card-sub">{conteudoAjuda}</p>
              ) : (
                <p className="praticas-card-sub">
                  Em breve, mais detalhes sobre <strong>{titulo}</strong>.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

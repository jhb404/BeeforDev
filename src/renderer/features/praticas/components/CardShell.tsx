import type { ReactNode } from 'react';
import { TemperaturaBadge } from './TemperaturaBadge';
import type { Temperatura } from '@shared/types/index';

interface CardShellProps {
  titulo: string;
  temperatura?: Temperatura | null;
  loading?: boolean;
  error?: string | null;
  vazio?: boolean;
  children: ReactNode;
}

/** Moldura comum dos cards de prática: header + estados loading/erro/vazio. */
export function CardShell({
  titulo,
  temperatura,
  loading,
  error,
  vazio,
  children,
}: CardShellProps) {
  return (
    <div className="card praticas-card">
      <header className="praticas-card-head">
        <h3>{titulo}</h3>
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
    </div>
  );
}

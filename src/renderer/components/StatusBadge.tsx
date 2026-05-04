import type { SessionStatus } from '../../shared/types';

const labels: Record<SessionStatus, string> = {
  idle: 'Inicializando',
  loading: 'Conectando…',
  reconnecting: 'Reconectando…',
  connected: 'Conectado',
  disconnected: 'Desconectado',
  expired: 'Sessão expirada',
  error: 'Erro',
};

export function StatusBadge({ status }: { status: SessionStatus }) {
  return (
    <span className={`status ${status}`}>
      <span className="blip" />
      {labels[status]}
    </span>
  );
}

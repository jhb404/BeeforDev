import { useEscapeToClose } from '../../../hooks/useEscapeToClose';

/** Modal placeholder de config (Capacity/Niko/Indicador). Config real fica via web por ora. */
export function ConfigModal({
  titulo,
  valor,
  onClose,
}: {
  titulo: string;
  valor: string;
  onClose: () => void;
}) {
  useEscapeToClose(true, onClose);
  return (
    <div className="praticas-modal-overlay" onClick={onClose}>
      <div className="praticas-modal" onClick={(e) => e.stopPropagation()}>
        <header className="praticas-modal-head">
          <h3>{titulo}</h3>
          <button
            type="button"
            className="praticas-modal-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </header>
        <div className="praticas-modal-body">
          <p>
            Valor atual: <strong>{valor}</strong>
          </p>
          <p className="praticas-card-sub">
            A configuração desta prática (metas, fontes, agendamento) é feita no Beefor web em
            “Configurar Práticas e Métricas”.
          </p>
        </div>
      </div>
    </div>
  );
}

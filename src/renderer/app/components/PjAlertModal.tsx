import { ModalShell } from '../../components/ui/ModalShell';

interface PjAlertModalProps {
  open: boolean;
  title: string;
  body: string;
  onClose: () => void;
}

/**
 * Lembrete mensal de ajuste de pontos PJ.
 * Modal central compacta — não bloqueia, só lembra com bom humor.
 */
export function PjAlertModal({ open, body, onClose }: PjAlertModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      className="pj-alert-modal pj-alert-modal--mini"
      labelledBy="pj-alert-title"
    >
      <div className="pj-alert__head">
        <p className="eyebrow pj-alert__eyebrow">Lembrete mensal</p>
        <h2 id="pj-alert-title" className="pj-alert__title">
          Ajustar Pontos
        </h2>
      </div>
      <div className="pj-alert__bell" aria-hidden="true">
        🔔
      </div>
      <p className="pj-alert__body">
        {body || 'Só te lembrando pra ajustar seu ponto...se não o dimdim não cai kk'}
      </p>
      <button type="button" className="warm pj-alert__cta" onClick={onClose} data-sound="close">
        GRADECIDO!
      </button>
    </ModalShell>
  );
}

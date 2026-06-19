import { ModalShell } from '../../components/ui/ModalShell';

interface PjAlertModalProps {
  open: boolean;
  title: string;
  body: string;
  onClose: () => void;
}

export function PjAlertModal({ open, title, body, onClose }: PjAlertModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      className="pj-alert-modal"
      labelledBy="pj-alert-title"
    >
      <div className="modal-head">
        <div>
          <p className="eyebrow">Lembrete mensal</p>
          <h2 id="pj-alert-title">{title}</h2>
        </div>
        <button type="button" className="secondary compact" onClick={onClose} data-sound="close">
          Fechar
        </button>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
        {body || 'Hoje é dia de ajustar os pontos no Beefor!'}
      </p>
    </ModalShell>
  );
}

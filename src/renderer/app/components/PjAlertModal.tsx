import { ModalShell } from '../../components/ui/ModalShell';

interface PjAlertModalProps {
  open: boolean;
  title: string;
  body: string;
  onClose: () => void;
}

/**
 * Lembrete mensal de ajuste de pontos PJ.
 * Modal central compacta (~360px) — não bloqueia, só lembra com bom humor.
 */
export function PjAlertModal({ open, title, body, onClose }: PjAlertModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      className="pj-alert-modal pj-alert-modal--mini"
      labelledBy="pj-alert-title"
    >
      <div className="pj-alert__icon" aria-hidden="true">
        <span className="pj-alert__icon-emoji">🧾</span>
        <span className="pj-alert__icon-sparkle pj-alert__icon-sparkle--a">✨</span>
        <span className="pj-alert__icon-sparkle pj-alert__icon-sparkle--b">✨</span>
      </div>
      <p className="eyebrow pj-alert__eyebrow">Lembrete mensal</p>
      <h2 id="pj-alert-title" className="pj-alert__title">
        {title.replace(/^[^\sA-Za-z0-9]+\s*/u, '') || 'Ajustar Pontos (PJ)'}
      </h2>
      <p className="pj-alert__body">{body || 'Hoje é dia de ajustar os pontos no Beefor!'}</p>
      <button type="button" className="warm pj-alert__cta" onClick={onClose} data-sound="close">
        Ok, valeu! 👍
      </button>
    </ModalShell>
  );
}

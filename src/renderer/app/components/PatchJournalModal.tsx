import { createPortal } from 'react-dom';
import { PatchJournal } from './PatchJournal';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';

interface PatchJournalModalProps {
  open: boolean;
  loading: boolean;
  text: string;
  onClose: () => void;
}

export function PatchJournalModal({
  open,
  loading,
  text,
  onClose,
}: PatchJournalModalProps) {
  useEscapeToClose(open, onClose);
  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop" role="presentation">
      <section
        aria-modal="true"
        className="modal-card"
        role="dialog"
        aria-label="Jornal de patches"
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">Novidades</p>
            <h2>Jornal de patches e atualizacoes</h2>
          </div>
          <button data-sound="close" className="secondary compact" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="patch-journal-modal-body">
          {loading ? (
            <p className="patch-journal-empty">Carregando novidades...</p>
          ) : (
            <PatchJournal text={text} />
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}

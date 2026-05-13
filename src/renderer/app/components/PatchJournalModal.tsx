import { ModalShell } from '../../components/ui/ModalShell';
import { PatchJournal } from './PatchJournal';

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
  return (
    <ModalShell open={open} onClose={onClose} label="Jornal de patches">
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
    </ModalShell>
  );
}

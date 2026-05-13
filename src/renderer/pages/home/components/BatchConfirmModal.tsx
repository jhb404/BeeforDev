import { ModalShell } from '../../../components/ui/ModalShell';
import { MONTHS_PT } from '../../../utils/dates';
import { formatMinutes } from '../../../utils/timeMath';
import { FIELDS, type RowState } from '../utils/rowState';

interface BatchEntry {
  row: RowState;
  index: number;
  worked: number;
}

interface BatchConfirmModalProps {
  open: boolean;
  busy: boolean;
  month: number;
  year: number;
  batchRows: BatchEntry[];
  onClose: () => void;
  onConfirm: () => void;
}

export function BatchConfirmModal({
  open,
  busy,
  month,
  year,
  batchRows,
  onClose,
  onConfirm,
}: BatchConfirmModalProps) {
  return (
    <ModalShell open={open} onClose={onClose} labelledBy="batch-modal-title">
      <div className="modal-head">
        <div>
          <p className="eyebrow">Confirmação</p>
          <h2 id="batch-modal-title">Lançar mês</h2>
        </div>
        <button className="secondary compact" onClick={onClose}>
          Fechar
        </button>
      </div>
      <p className="modal-copy">
        O app vai lançar {batchRows.length} dia(s) preenchido(s) em{' '}
        {MONTHS_PT[month - 1]} de {year}. Confira antes de confirmar.
      </p>
      <div className="batch-preview">
        {batchRows.map(({ row, worked }) => {
          const filled = FIELDS.map((f) => ({
            label: f.label,
            value: row[f.key],
          })).filter((f) => f.value);
          return (
            <div className="batch-preview-row" key={row.date}>
              <strong>
                {row.date.slice(8, 10)}/{row.date.slice(5, 7)}
              </strong>
              <span>
                {filled.map((f) => `${f.label}: ${f.value}`).join(' · ') ||
                  'Sem horários'}
              </span>
              <span>Total: {worked > 0 ? formatMinutes(worked) : '00:00'}</span>
              {row.comentario && <span>Comentário: {row.comentario}</span>}
            </div>
          );
        })}
      </div>
      <div className="modal-actions">
        <button className="secondary" onClick={onClose}>
          Cancelar
        </button>
        <button className="warm" disabled={busy} onClick={onConfirm}>
          Confirmar lançamento
        </button>
      </div>
    </ModalShell>
  );
}

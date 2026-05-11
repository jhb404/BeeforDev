import { WEEKDAY_SHORT_PT } from '../../../utils/dates';
import { formatMinutes, workedMinutes } from '../../../utils/timeMath';
import { FIELDS, rowStatusKind, type RowState } from '../utils/rowState';

interface TimesheetGridProps {
  rows: RowState[];
  today: string;
  hoursPerDayMin: number;
  busy: boolean;
  ready: boolean;
  onUpdateRow: (idx: number, patch: Partial<RowState>) => void;
  onLancar: (idx: number) => void;
}

export function TimesheetGrid({
  rows,
  today,
  hoursPerDayMin,
  busy,
  ready,
  onUpdateRow,
  onLancar,
}: TimesheetGridProps) {
  return (
    <div className="ts-grid" role="table">
      <div className="ts-grid-head" role="row">
        <span>Data</span>
        {FIELDS.map((f) => (
          <span key={f.key}>{f.label}</span>
        ))}
        <span>Total</span>
        <span>Saldo</span>
        <span>Status</span>
        <span>Comentário</span>
        <span>Ação</span>
      </div>

      {rows.map((r, i) => {
        const isWeekend = r.weekday === 0 || r.weekday === 6;
        const isHoliday = (r.status ?? '').toLowerCase().includes('feriado');
        const isToday = r.date === today;
        const statusKind = rowStatusKind(r);
        const worked = workedMinutes(r);
        const diff = worked > 0 ? worked - hoursPerDayMin : 0;
        const totalLabel = worked > 0 ? formatMinutes(worked) : '00:00';
        const diffLabel = worked > 0 ? formatMinutes(diff, true) : '00:00';
        const diffClass =
          worked === 0
            ? ''
            : diff > 0
            ? 'diff-pos'
            : diff < 0
            ? 'diff-neg'
            : 'diff-zero';

        return (
          <div
            className={`ts-grid-row ${isWeekend ? 'weekend' : ''} ${
              isHoliday ? 'holiday' : ''
            } ${isToday ? 'today' : ''} ${r.saved ? 'saved' : ''} ${r.failed ? 'failed' : ''}`}
            key={r.date}
            role="row"
          >
            <div className="date-cell">
              <strong>
                {r.date.slice(8, 10)}/{r.date.slice(5, 7)}
              </strong>
              <span>{WEEKDAY_SHORT_PT[r.weekday]}</span>
            </div>
            {FIELDS.map((f) => (
              <label className="time-cell" key={f.key}>
                <span className="mobile-label">{f.label}</span>
                <input
                  type="time"
                  disabled={false}
                  value={r[f.key]}
                  aria-label={`${f.label} ${r.date}`}
                  onChange={(e) =>
                    onUpdateRow(i, { [f.key]: e.target.value } as Partial<RowState>)
                  }
                />
              </label>
            ))}
            <div className="metric-cell">
              <span className="mobile-label">Total</span>
              <strong className="mono">{totalLabel}</strong>
            </div>
            <div className="metric-cell">
              <span className="mobile-label">Saldo</span>
              <strong className={`mono ${diffClass}`}>{diffLabel}</strong>
            </div>
            <div className="status-cell">
              <span className="mobile-label">Status</span>
              <span
                className={`status-pill status-pill--${statusKind}`}
                aria-hidden="true"
              />
              <span>{r.status || (isToday ? 'Hoje' : '-')}</span>
            </div>
            <label className="comment-cell">
              <span className="mobile-label">Comentário</span>
              <input
                type="text"
                disabled={false}
                placeholder="Observação"
                value={r.comentario ?? ''}
                onChange={(e) => onUpdateRow(i, { comentario: e.target.value })}
              />
            </label>
            <div className="row-action">
              <span className="mobile-label">Ação</span>
              <button
                data-sound="lancar-dia"
                disabled={busy || !ready || r.saving}
                onClick={() => onLancar(i)}
                title={r.errMsg ?? ''}
              >
                {r.saving ? 'Salvando' : 'Lançar'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

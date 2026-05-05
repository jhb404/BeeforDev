import { useMemo, useState } from 'react';
import type { TimesheetEntry } from '../../shared/types';
import { MONTHS_PT, WEEKDAY_SHORT_PT, todayIso } from '../utils/dates';
import { formatMinutes, workedMinutes } from '../utils/timeMath';

const FIELDS: Array<{
  key: keyof Omit<TimesheetEntry, 'date' | 'comentario'>;
  label: string;
}> = [
  { key: 'entrada', label: 'Entrada' },
  { key: 'int1', label: 'Int. 1' },
  { key: 'ret1', label: 'Ret. 1' },
  { key: 'int2', label: 'Int. 2' },
  { key: 'ret2', label: 'Ret. 2' },
  { key: 'saida', label: 'Saída' },
];

interface RowState extends TimesheetEntry {
  weekday: number;
  status?: string;
  editable: boolean;
  saving?: boolean;
  saved?: boolean;
  failed?: boolean;
  errMsg?: string;
}

interface Props {
  rows: RowState[];
  year: number;
  month: number;
  busy: boolean;
  ready: boolean;
  hoursPerDayMin: number;
  onUpdateRow: (idx: number, patch: Partial<RowState>) => void;
  onLancar: (idx: number) => void;
}

function statusOf(r: RowState): 'full' | 'partial' | 'empty' | 'weekend' | 'holiday' {
  if ((r.status ?? '').toLowerCase().includes('feriado')) return 'holiday';
  if (r.weekday === 0 || r.weekday === 6) return 'weekend';
  const filled = [r.entrada, r.int1, r.ret1, r.int2, r.ret2, r.saida].filter(Boolean).length;
  if (filled === 6) return 'full';
  if (filled > 0) return 'partial';
  return 'empty';
}

export function MinimalView({
  rows,
  year,
  month,
  busy,
  ready,
  hoursPerDayMin,
  onUpdateRow,
  onLancar,
}: Props) {
  const today = todayIso();
  const todayIndex = rows.findIndex((r) => r.date === today);
  const [selectedIdx, setSelectedIdx] = useState<number>(
    todayIndex >= 0 ? todayIndex : 0,
  );

  // First weekday of the month (Sunday=0) for grid offset
  const firstWeekday = rows.length > 0 ? rows[0].weekday : 0;

  const selected = rows[selectedIdx];
  const selectedWorked = selected ? workedMinutes(selected) : 0;
  const selectedDiff = selectedWorked > 0 ? selectedWorked - hoursPerDayMin : 0;

  const calendarCells = useMemo(() => {
    const cells: Array<RowState | null> = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    rows.forEach((r) => cells.push(r));
    return cells;
  }, [rows, firstWeekday]);

  if (!selected) return null;

  return (
    <div className="minimal-view">
      <div className="minimal-calendar">
        <div className="cal-head">
          {WEEKDAY_SHORT_PT.map((d) => (
            <span key={d} className="cal-dow">
              {d}
            </span>
          ))}
        </div>
        <div className="cal-grid">
          {calendarCells.map((cell, i) => {
            if (!cell) return <span key={`pad-${i}`} className="cal-cell empty-pad" />;
            const idx = rows.indexOf(cell);
            const st = statusOf(cell);
            const isToday = cell.date === today;
            const isSelected = idx === selectedIdx;
            return (
              <button
                key={cell.date}
                type="button"
                className={`cal-cell st-${st} ${isToday ? 'today' : ''} ${
                  isSelected ? 'selected' : ''
                } ${cell.saved ? 'saved' : ''} ${cell.failed ? 'failed' : ''}`}
                onClick={() => setSelectedIdx(idx)}
                title={`${cell.date.slice(8, 10)}/${cell.date.slice(5, 7)} — ${
                  st === 'full'
                    ? 'completo'
                    : st === 'partial'
                    ? 'parcial'
                    : st === 'holiday'
                    ? 'feriado'
                    : st === 'weekend'
                    ? 'fim de semana'
                    : 'vazio'
                }`}
              >
                <span className="cal-num">{cell.date.slice(8, 10)}</span>
                <span className="cal-dot" />
              </button>
            );
          })}
        </div>
        <div className="cal-legend">
          <span><i className="dot st-full" /> Completo</span>
          <span><i className="dot st-partial" /> Parcial</span>
          <span><i className="dot st-empty" /> Vazio</span>
          <span><i className="dot st-holiday" /> Feriado</span>
        </div>
      </div>

      <div className="minimal-day">
        <div className="day-head">
          <div>
            <p className="eyebrow">
              {WEEKDAY_SHORT_PT[selected.weekday]} ·{' '}
              {selected.date === today ? 'Hoje' : 'Selecionado'}
            </p>
            <h3>
              {selected.date.slice(8, 10)} de {MONTHS_PT[month - 1]} de {year}
            </h3>
          </div>
          <div className="day-totals">
            <div className="day-total">
              <span className="label">Trabalhado</span>
              <strong className="mono">
                {selectedWorked > 0 ? formatMinutes(selectedWorked) : '00:00'}
              </strong>
            </div>
            <div className={`day-total ${selectedDiff >= 0 ? 'pos' : 'neg'}`}>
              <span className="label">Saldo</span>
              <strong className="mono">
                {selectedWorked > 0 ? formatMinutes(selectedDiff, true) : '00:00'}
              </strong>
            </div>
          </div>
        </div>

        <div className="day-fields">
          {FIELDS.map((f) => (
            <label className="day-field" key={f.key}>
              <span className="label">{f.label}</span>
              <input
                type="time"
                value={selected[f.key]}
                onChange={(e) =>
                  onUpdateRow(selectedIdx, {
                    [f.key]: e.target.value,
                  } as Partial<RowState>)
                }
              />
            </label>
          ))}
        </div>

        <label className="day-comment">
          <span className="label">Comentário</span>
          <input
            type="text"
            placeholder="Observação"
            value={selected.comentario ?? ''}
            onChange={(e) =>
              onUpdateRow(selectedIdx, { comentario: e.target.value })
            }
          />
        </label>

        <div className="day-actions">
          {selected.status && (
            <span className="day-status">{selected.status}</span>
          )}
          <button
            disabled={busy || !ready || selected.saving}
            onClick={() => onLancar(selectedIdx)}
            title={selected.errMsg ?? ''}
          >
            {selected.saving
              ? 'Salvando...'
              : selected.saved
              ? 'Salvar de novo'
              : 'Lançar dia'}
          </button>
        </div>
      </div>
    </div>
  );
}

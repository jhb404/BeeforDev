import { MONTHS_PT } from '../../../utils/dates';

const STORAGE_KEY = 'beefor_hkr_unlocked';

interface TimesheetToolbarProps {
  year: number;
  month: number;
  yearOptions: number[];
  busy: boolean;
  ready: boolean;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onAutoLancamento: () => void;
  onImportarMes?: () => void;
}

export function TimesheetToolbar({
  year,
  month,
  yearOptions,
  busy,
  ready,
  onYearChange,
  onMonthChange,
  onAutoLancamento,
  onImportarMes,
}: TimesheetToolbarProps) {
  const hackerUnlocked = localStorage.getItem(STORAGE_KEY) === '1';

  return (
    <div className="ts-toolbar">
      <div className="ts-filters">
        <label className="field-inline">
          <span className="label">Ano</span>
          <select value={year} onChange={(e) => onYearChange(Number(e.target.value))}>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="field-inline">
          <span className="label">Mês</span>
          <select value={month} onChange={(e) => onMonthChange(Number(e.target.value))}>
            {MONTHS_PT.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="ts-actions">
        <button
          data-sound="auto-lancar-start"
          className="warm"
          disabled={busy || !ready}
          onClick={onAutoLancamento}
        >
          Auto lançamento
        </button>

        {hackerUnlocked && onImportarMes && (
          <button className="ts-importar-mes" disabled={busy || !ready} onClick={onImportarMes}>
            ⚡ Importar mês
          </button>
        )}
      </div>
    </div>
  );
}

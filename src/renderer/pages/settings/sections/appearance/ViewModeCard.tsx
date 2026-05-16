import { Switch } from '../../Switch';
import type { ViewModeCardProps } from './types';

export function ViewModeCard({ settings, onUpdate, onChangeViewMode }: ViewModeCardProps) {
  return (
    <div className="card">
      <h2>Visualização</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 12px' }}>
        Troca aplica reiniciando o app automaticamente.
      </p>
      {settings.viewMode === 'minimal' && (
        <Switch
          id="calendarShowDiff"
          checked={settings.calendarShowDiff ?? false}
          onChange={(v) => onUpdate('calendarShowDiff', v)}
          label="Mostrar saldo diário nas células do calendário"
        />
      )}
      <div className="view-mode-row">
        <button
          type="button"
          className={`view-mode-opt ${(settings.viewMode ?? 'classic') === 'classic' ? 'active' : ''}`}
          onClick={() => onChangeViewMode('classic')}
        >
          <svg className="vm-preview" viewBox="0 0 120 70" aria-hidden="true">
            <rect x="4" y="4" width="112" height="10" rx="2" fill="var(--bg-3)" />
            <rect x="4" y="18" width="112" height="6" rx="1" fill="var(--accent-soft)" />
            <rect x="4" y="28" width="112" height="6" rx="1" fill="var(--bg-3)" />
            <rect x="4" y="38" width="112" height="6" rx="1" fill="var(--bg-3)" />
            <rect x="4" y="48" width="112" height="6" rx="1" fill="var(--bg-3)" />
            <rect x="4" y="58" width="112" height="6" rx="1" fill="var(--bg-3)" />
          </svg>
          <strong>Clássica</strong>
          <span>Tabela linha-a-linha com todos os dias</span>
        </button>
        <button
          type="button"
          className={`view-mode-opt ${settings.viewMode === 'minimal' ? 'active' : ''}`}
          onClick={() => onChangeViewMode('minimal')}
        >
          <svg className="vm-preview" viewBox="0 0 120 70" aria-hidden="true">
            <rect x="4" y="4" width="54" height="62" rx="3" fill="var(--bg-3)" />
            {[0, 1, 2, 3].map((row) =>
              [0, 1, 2, 3, 4].map((col) => (
                <rect
                  key={`${row}-${col}`}
                  x={7 + col * 10}
                  y={9 + row * 14}
                  width="8"
                  height="11"
                  rx="1.5"
                  fill={row === 1 && col === 2 ? 'var(--accent)' : 'var(--bg-2)'}
                />
              )),
            )}
            <rect x="62" y="4" width="54" height="62" rx="3" fill="var(--bg-3)" />
            <rect x="66" y="9" width="30" height="6" rx="1" fill="var(--accent-soft)" />
            <rect x="66" y="20" width="46" height="5" rx="1" fill="var(--bg-2)" />
            <rect x="66" y="28" width="46" height="5" rx="1" fill="var(--bg-2)" />
            <rect x="66" y="36" width="46" height="5" rx="1" fill="var(--bg-2)" />
            <rect x="66" y="50" width="20" height="10" rx="2" fill="var(--accent)" />
          </svg>
          <strong>Minimalista</strong>
          <span>Calendário + dia selecionado</span>
        </button>
      </div>
    </div>
  );
}

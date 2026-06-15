import type { AppearanceCardProps } from '../types';

export function DensityCard({ settings, onUpdate }: AppearanceCardProps) {
  return (
    <div className="card">
      <h2>Densidade da interface</h2>
      <div className="density-row">
        {(['compact', 'normal', 'comfortable'] as const).map((d) => (
          <button
            key={d}
            type="button"
            className={`density-opt ${(settings.uiDensity ?? 'normal') === d ? 'active' : ''}`}
            onClick={() => onUpdate('uiDensity', d)}
          >
            <span className="density-bars">
              {Array.from({ length: d === 'compact' ? 5 : d === 'normal' ? 3 : 2 }).map((_, i) => (
                <i key={i} />
              ))}
            </span>
            <strong>
              {d === 'compact' ? 'Compacto' : d === 'normal' ? 'Normal' : 'Confortável'}
            </strong>
          </button>
        ))}
      </div>
    </div>
  );
}

import type { AppSettings } from '../../../../shared/types';

interface JornadaCardProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
}

export function JornadaCard({ settings, onUpdate }: JornadaCardProps) {
  return (
    <div className="card">
      <h2>Jornada</h2>
      <div className="field">
        <label className="label">Horas por dia</label>
        <input
          type="number"
          min={1}
          max={24}
          step={0.5}
          value={settings.hoursPerDay}
          onChange={(e) => onUpdate('hoursPerDay', Number(e.target.value) || 0)}
        />
      </div>
      <div className="field">
        <label className="label">Valor da hora (R$)</label>
        <input
          type="number"
          min={0}
          step={0.01}
          value={settings.hourRate}
          onChange={(e) => onUpdate('hourRate', Number(e.target.value) || 0)}
        />
      </div>
    </div>
  );
}

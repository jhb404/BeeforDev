import type { AppSettings } from '@shared/types/index';
import { Switch } from '../Switch';

interface JornadaCardProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
}

export function JornadaCard({ settings, onUpdate }: JornadaCardProps) {
  const hasRate = (settings.hourRate ?? 0) > 0;
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
      {hasRate && (
        <>
          <Switch
            id="showOvertimeValue"
            checked={settings.showOvertimeValue ?? true}
            onChange={(v) => onUpdate('showOvertimeValue', v)}
            label="Mostrar Valor extras"
          />
          <Switch
            id="showTotalSalary"
            checked={settings.showTotalSalary ?? true}
            onChange={(v) => onUpdate('showTotalSalary', v)}
            label="Mostrar Total estimado"
          />
        </>
      )}
    </div>
  );
}

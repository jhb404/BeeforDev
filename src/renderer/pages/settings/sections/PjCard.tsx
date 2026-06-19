import type { AppSettings } from '@shared/types/index';
import { Switch } from '../Switch';

interface PjCardProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
  onTest: () => void;
}

export function PjCard({ settings, onUpdate, onTest }: PjCardProps) {
  return (
    <div className="card kudocard-card">
      <div className="row between" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Alerta AJUSTAR PONTOS (PJ)</h2>
        <button className="secondary compact" onClick={onTest}>
          Testar
        </button>
      </div>
      <Switch
        id="pjAlarm"
        checked={settings.pjAlarm}
        onChange={(v) => onUpdate('pjAlarm', v)}
        label="Lembrete mensal para ajustar pontos"
      />
      <div className="field" style={{ marginTop: 6 }}>
        <label className="label">Horário do alerta</label>
        <input
          type="time"
          disabled={!settings.pjAlarm}
          value={settings.pjAlarmTime}
          onChange={(e) => onUpdate('pjAlarmTime', e.target.value)}
        />
      </div>
      <div className="field" style={{ marginTop: 6 }}>
        <label className="label">Dia do mês</label>
      </div>
      <div className="kudocard-days">
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <button
            key={d}
            type="button"
            className={`day-chip ${settings.pjAlarmDay === d ? 'active' : ''}`}
            disabled={!settings.pjAlarm}
            onClick={() => onUpdate('pjAlarmDay', d)}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

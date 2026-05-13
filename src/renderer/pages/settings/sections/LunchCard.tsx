import type { AppSettings } from '@shared/types';
import { Switch } from '../Switch';

interface LunchCardProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
  onTest: () => void;
}

export function LunchCard({ settings, onUpdate, onTest }: LunchCardProps) {
  return (
    <div className="card">
      <div className="row between" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Alerta ALMOÇO</h2>
        <button className="secondary compact" onClick={onTest}>
          Testar
        </button>
      </div>
      <Switch
        id="lunchAlarm"
        checked={settings.lunchAlarm}
        onChange={(v) => onUpdate('lunchAlarm', v)}
        label="Alarme de almoço"
      />
      <div className="field">
        <label className="label">Horário do alarme</label>
        <input
          type="time"
          disabled={!settings.lunchAlarm}
          value={settings.lunchAlarmTime}
          onChange={(e) => onUpdate('lunchAlarmTime', e.target.value)}
        />
      </div>
    </div>
  );
}

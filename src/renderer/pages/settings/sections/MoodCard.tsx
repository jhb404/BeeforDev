import type { AppSettings } from '../../../../shared/types';
import { Switch } from '../Switch';

interface MoodCardProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
  onTest: () => void;
}

export function MoodCard({ settings, onUpdate, onTest }: MoodCardProps) {
  return (
    <div className="card">
      <div className="row between" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Alerta de MOOD</h2>
        <button className="secondary compact" onClick={onTest}>
          Testar
        </button>
      </div>
      <Switch
        id="moodNotification"
        checked={settings.moodNotification}
        onChange={(v) => onUpdate('moodNotification', v)}
        label="Notificação diária de mood"
      />
      <Switch
        id="moodAlarm"
        checked={settings.moodAlarm}
        onChange={(v) => onUpdate('moodAlarm', v)}
        label="Tocar alarme com a notificação"
      />
      <div className="field">
        <label className="label">Horário</label>
        <input
          type="time"
          disabled={!settings.moodNotification && !settings.moodAlarm}
          value={settings.moodNotificationTime}
          onChange={(e) => onUpdate('moodNotificationTime', e.target.value)}
        />
      </div>
    </div>
  );
}

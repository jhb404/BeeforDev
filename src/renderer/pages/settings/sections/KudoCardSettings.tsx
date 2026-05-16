import type { AppSettings, KudocardFrequency } from '@shared/types/index';
import { Switch } from '../Switch';

interface KudoCardSettingsProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
  onToggleDay: (day: number) => void;
  onTest: () => void;
}

export function KudoCardSettings({
  settings,
  onUpdate,
  onToggleDay,
  onTest,
}: KudoCardSettingsProps) {
  return (
    <div className="card kudocard-card">
      <div className="row between" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Alerta KUDOCARD</h2>
        <button className="secondary compact" onClick={onTest}>
          Testar
        </button>
      </div>
      <Switch
        id="kudocardNotification"
        checked={settings.kudocardNotification}
        onChange={(v) => onUpdate('kudocardNotification', v)}
        label="Notificação para enviar kudocard"
      />
      <div className="field" style={{ marginTop: 6 }}>
        <label className="label">Horário (opcional — vazio = aleatório)</label>
        <input
          type="time"
          disabled={!settings.kudocardNotification}
          value={settings.kudocardNotificationTime ?? ''}
          onChange={(e) =>
            onUpdate('kudocardNotificationTime', e.target.value || undefined)
          }
        />
      </div>
      <div
        className="kudocard-freq"
        style={{ opacity: settings.kudocardNotification ? 1 : 0.5 }}
      >
        {(['once', 'twice', 'custom'] as KudocardFrequency[]).map((f) => (
          <label key={f} className="kudocard-freq__opt">
            <input
              type="radio"
              name="kudocardFreq"
              checked={settings.kudocardFrequency === f}
              disabled={!settings.kudocardNotification}
              onChange={() => onUpdate('kudocardFrequency', f)}
            />
            <span>
              {f === 'once' && '1× aleatória no mês'}
              {f === 'twice' && '2× aleatórias no mês'}
              {f === 'custom' && 'Eu escolho as datas'}
            </span>
          </label>
        ))}
      </div>
      {settings.kudocardFrequency === 'custom' && (
        <div className="kudocard-days">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              type="button"
              className={`day-chip ${settings.kudocardDays.includes(d) ? 'active' : ''}`}
              disabled={!settings.kudocardNotification}
              onClick={() => onToggleDay(d)}
            >
              {d}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

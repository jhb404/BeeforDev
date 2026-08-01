import type { AppSettings } from '@shared/types/index';
import { PUNCH_ICONS, PUNCH_LABELS } from '../defaults';
import { Switch } from '../Switch';

interface PunchCardProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
  onUpdatePunchTime: (idx: 0 | 1 | 2 | 3, value: string) => void;
  onTest: () => void;
}

/**
 * Alerta DIÁRIO de lançamento de horas — só notifica nos horários configurados;
 * o lançamento em si é feito pela pessoa. O lembrete MENSAL fica no `PjCard`.
 */
export function PunchCard({ settings, onUpdate, onUpdatePunchTime, onTest }: PunchCardProps) {
  return (
    <div className="card">
      <div className="row between" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Alerta de lançamento de horas (diário)</h2>
        <button className="secondary compact" onClick={onTest}>
          Testar
        </button>
      </div>
      <Switch
        id="automatePunch"
        checked={settings.automatePunch}
        onChange={(v) => onUpdate('automatePunch', v)}
        label="Ativar alerta de lançamento de horas"
      />
      <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '2px 0 8px' }}>
        Avisa nos horários abaixo para você lançar as horas no Beefor.
      </p>
      <div className="punch-grid">
        {PUNCH_LABELS.map((lab, i) => (
          <div className="field" key={lab}>
            <label className="label">
              {PUNCH_ICONS[i]} {lab}
            </label>
            <input
              type="time"
              disabled={!settings.automatePunch}
              value={settings.punchTimes[i] ?? ''}
              onChange={(e) => onUpdatePunchTime(i as 0 | 1 | 2 | 3, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

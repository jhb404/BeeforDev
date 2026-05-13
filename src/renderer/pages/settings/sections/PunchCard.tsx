import type { AppSettings } from '@shared/types';
import { PUNCH_LABELS } from '../defaults';
import { Switch } from '../Switch';

interface PunchCardProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
  onUpdatePunchTime: (idx: 0 | 1 | 2 | 3, value: string) => void;
  onTest: () => void;
}

export function PunchCard({ settings, onUpdate, onUpdatePunchTime, onTest }: PunchCardProps) {
  return (
    <div className="card">
      <div className="row between" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>AUTOMATIZAR BATIDA DE PONTO</h2>
        <button className="secondary compact" onClick={onTest}>
          Testar
        </button>
      </div>
      <Switch
        id="automatePunch"
        checked={settings.automatePunch}
        onChange={(v) => onUpdate('automatePunch', v)}
        label="Ativar batida automática"
      />
      <div className="punch-grid">
        {PUNCH_LABELS.map((lab, i) => (
          <div className="field" key={lab}>
            <label className="label">{lab}</label>
            <input
              type="time"
              disabled={!settings.automatePunch}
              value={settings.punchTimes[i] ?? ''}
              onChange={(e) => onUpdatePunchTime(i as 0 | 1 | 2 | 3, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="field" style={{ marginTop: 10 }}>
        <label className="label">Variação aleatória diária (± minutos)</label>
        <input
          type="number"
          min={0}
          max={60}
          disabled={!settings.automatePunch}
          value={settings.punchDriftMinutes}
          onChange={(e) =>
            onUpdate('punchDriftMinutes', Math.max(0, Number(e.target.value) || 0))
          }
        />
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
          Cada dia recebe um deslocamento aleatório (em minutos) somado/subtraído
          de cada horário base, pra simular variação natural.
        </p>
      </div>
    </div>
  );
}

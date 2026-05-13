import type { AppSettings } from '@shared/types';
import { Switch } from '../Switch';

interface GeneralCardProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
}

export function GeneralCard({ settings, onUpdate }: GeneralCardProps) {
  return (
    <div className="card">
      <h2>Configuração geral</h2>
      <Switch
        id="autostart"
        checked={settings.autoStart}
        onChange={(v) => onUpdate('autoStart', v)}
        label="Abrir ao iniciar o PC"
      />
      <Switch
        id="autologin"
        checked={settings.autoLoginOnLaunch}
        onChange={(v) => onUpdate('autoLoginOnLaunch', v)}
        label="Restaurar sessão ao abrir"
      />
      <Switch
        id="uiSounds"
        checked={settings.uiSounds ?? false}
        onChange={(v) => onUpdate('uiSounds', v)}
        label="Efeitos sonoros da interface"
      />
    </div>
  );
}

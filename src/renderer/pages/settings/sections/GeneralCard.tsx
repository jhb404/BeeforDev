import { useEffect, useState } from 'react';
import type { AppSettings } from '@shared/types/index';
import { Switch } from '../Switch';

interface GeneralCardProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
}

type BeeforEnv = 'local' | 'prod';

export function GeneralCard({ settings, onUpdate }: GeneralCardProps) {
  const [env, setEnv] = useState<BeeforEnv>(settings.beeforEnv ?? 'prod');
  const [switching, setSwitching] = useState(false);
  const [switchMsg, setSwitchMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!window.beeforHttp?.getEnv) return;
      const res = await window.beeforHttp.getEnv();
      if (cancelled) return;
      if (res.ok && (res.data === 'local' || res.data === 'prod')) {
        setEnv(res.data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleEnvChange(next: BeeforEnv) {
    if (next === env) return;
    setSwitching(true);
    setSwitchMsg(null);
    try {
      if (!window.beeforHttp?.setEnv) {
        setSwitchMsg('API HTTP indisponível — reinicie o app.');
        return;
      }
      const res = await window.beeforHttp.setEnv(next);
      if (!res.ok) {
        setSwitchMsg(res.error || 'Falha ao trocar ambiente.');
        return;
      }
      setEnv(next);
      onUpdate('beeforEnv', next);
      setSwitchMsg(
        next === 'local'
          ? 'Ambiente local ativo (localhost:44341).'
          : 'Ambiente produção ativo (apiteams.goobee.com.br).',
      );
    } catch (err) {
      setSwitchMsg(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setSwitching(false);
    }
  }

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

      <div className="settings-row" style={{ marginTop: 12 }}>
        <label htmlFor="beefor-env" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Ambiente da API</span>
          <small style={{ opacity: 0.7 }}>
            Local = localhost (dev). Produção = apiteams.goobee.com.br.
          </small>
        </label>
        <select
          id="beefor-env"
          value={env}
          disabled={switching}
          onChange={(e) => handleEnvChange(e.target.value as BeeforEnv)}
          style={{ marginLeft: 'auto' }}
        >
          <option value="prod">Produção</option>
          <option value="local">Local (dev)</option>
        </select>
      </div>
      {switching && <p style={{ fontSize: 12, opacity: 0.7 }}>Reconectando…</p>}
      {switchMsg && !switching && (
        <p style={{ fontSize: 12, opacity: 0.85 }}>{switchMsg}</p>
      )}

      <div className="settings-row" style={{ marginTop: 12 }}>
        <label htmlFor="beefor-login-mode" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Modo de login</span>
          <small style={{ opacity: 0.7 }}>
            HTTP = sem Chromium (mobile-ready, experimental). Playwright = legado, abre browser.
          </small>
        </label>
        <select
          id="beefor-login-mode"
          value={settings.loginMode ?? 'playwright'}
          onChange={(e) =>
            onUpdate('loginMode', e.target.value === 'http' ? 'http' : 'playwright')
          }
          style={{ marginLeft: 'auto' }}
        >
          <option value="playwright">Playwright (legado)</option>
          <option value="http">HTTP direto (experimental)</option>
        </select>
      </div>
      <p style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>
        Após trocar, deslogue e logue novamente.
      </p>
    </div>
  );
}

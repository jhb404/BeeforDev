import { useEffect, useState } from 'react';
import type { AppSettings } from '../../shared/types';

export function Settings() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    autoStart: true,
    autoLoginOnLaunch: true,
    hoursPerDay: 8,
    hourRate: 0,
  });
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void window.beefor.getCredentials().then((c) => {
      if (c) {
        setSavedEmail(c.email);
        setEmail(c.email);
      }
    });
    void window.beefor.getSettings().then(setSettings);
  }, []);

  const save = async () => {
    if (!email || !password) {
      setMsg('Preencha e-mail e senha.');
      return;
    }
    const res = await window.beefor.saveCredentials({ email, password });
    setMsg(res.ok ? 'Credenciais salvas no Credential Manager.' : `Erro: ${res.error}`);
    if (res.ok) {
      setSavedEmail(email);
      setPassword('');
    }
  };

  const clear = async () => {
    const res = await window.beefor.clearCredentials();
    setMsg(res.ok ? 'Credenciais removidas.' : `Erro: ${res.error}`);
    if (res.ok) {
      setSavedEmail(null);
      setEmail('');
      setPassword('');
    }
  };

  const updateSetting = async <K extends keyof AppSettings>(
    k: K,
    v: AppSettings[K],
  ) => {
    const next = { ...settings, [k]: v };
    setSettings(next);
    await window.beefor.setSettings(next);
  };

  return (
    <div className="grid cols-2">
      <div className="card">
        <h2>Credenciais</h2>
        <div className="field">
          <label className="label">E-mail Beefor</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            autoComplete="username"
          />
        </div>
        <div className="field">
          <label className="label">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={savedEmail ? '••••••••' : 'sua senha'}
            autoComplete="current-password"
          />
        </div>
        <div className="row">
          <button onClick={save}>Salvar</button>
          <button className="danger" onClick={clear}>
            Remover
          </button>
        </div>
        {savedEmail && (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 12 }}>
            Salvo: <strong>{savedEmail}</strong> (senha cifrada no Credential Manager
            do Windows)
          </p>
        )}
        {msg && (
          <p style={{ color: 'var(--accent-2)', fontSize: 13, marginTop: 8 }}>{msg}</p>
        )}
      </div>

      <div className="card">
        <h2>Inicialização</h2>
        <div className="checkbox-row" style={{ marginBottom: 12 }}>
          <input
            id="autostart"
            type="checkbox"
            checked={settings.autoStart}
            onChange={(e) => updateSetting('autoStart', e.target.checked)}
          />
          <label htmlFor="autostart">Abrir ao iniciar o PC</label>
        </div>
        <div className="checkbox-row">
          <input
            id="autologin"
            type="checkbox"
            checked={settings.autoLoginOnLaunch}
            onChange={(e) => updateSetting('autoLoginOnLaunch', e.target.checked)}
          />
          <label htmlFor="autologin">Restaurar sessão automaticamente ao abrir</label>
        </div>
      </div>

      <div className="card">
        <h2>Jornada</h2>
        <div className="field">
          <label className="label">Horas trabalhadas por dia</label>
          <input
            type="number"
            min={1}
            max={24}
            step={0.5}
            value={settings.hoursPerDay}
            onChange={(e) =>
              updateSetting('hoursPerDay', Number(e.target.value) || 0)
            }
          />
        </div>
        <div className="field">
          <label className="label">Valor da hora (R$)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={settings.hourRate}
            onChange={(e) =>
              updateSetting('hourRate', Number(e.target.value) || 0)
            }
          />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
          Usado para calcular Diff por dia e Salário estimado na tela inicial.
        </p>
      </div>

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h2>Segurança</h2>
        <ul style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.8 }}>
          <li>Senha gravada no Windows Credential Manager (via keytar).</li>
          <li>Cookies / localStorage do Beefor salvos em <code>storageState</code> isolado.</li>
          <li>Em caso de MFA / CAPTCHA, o app pede login manual — não burla autenticação.</li>
          <li>Use “Remover” ao trocar de máquina ou ao sair.</li>
        </ul>
      </div>
    </div>
  );
}

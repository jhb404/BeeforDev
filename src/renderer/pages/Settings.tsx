import { useEffect, useState } from 'react';
import type { AppSettings, KudocardFrequency } from '../../shared/types';

const DEFAULT_PUNCH: AppSettings['punchTimes'] = ['09:00', '12:00', '13:00', '18:00'];

const DEFAULTS: AppSettings = {
  autoStart: true,
  autoLoginOnLaunch: true,
  automatePunch: false,
  punchTimes: DEFAULT_PUNCH,
  punchDriftMinutes: 10,
  lunchAlarm: false,
  lunchAlarmTime: '12:00',
  moodNotification: false,
  moodNotificationTime: '09:30',
  moodAlarm: false,
  kudocardNotification: false,
  kudocardFrequency: 'once',
  kudocardDays: [],
  hoursPerDay: 8,
  hourRate: 0,
};

const PUNCH_LABELS = ['Entrada', 'Saída almoço', 'Retorno', 'Saída'];

export function Settings() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [msg, setMsg] = useState<string | null>(null);
  const [admin, setAdmin] = useState<{ elevated: boolean; platform: string } | null>(null);

  const refreshAdmin = () => {
    void window.beefor.getAdminStatus().then(setAdmin);
  };

  useEffect(() => {
    void window.beefor.getCredentials().then((c) => {
      if (c) {
        setSavedEmail(c.email);
        setEmail(c.email);
      }
    });
    void window.beefor.getSettings().then((s) => {
      setSettings({ ...DEFAULTS, ...s });
    });
    refreshAdmin();
  }, []);

  const needsAdmin =
    settings.automatePunch ||
    settings.lunchAlarm ||
    settings.moodAlarm ||
    settings.moodNotification ||
    settings.kudocardNotification;

  const elevateNow = async () => {
    const res = await window.beefor.relaunchAsAdmin();
    if (!res.ok) setMsg(`Falha ao elevar: ${res.error}`);
  };

  const testNotif = async (kind: 'mood' | 'lunch' | 'kudocard' | 'punch') => {
    const res = await window.beefor.testNotification(kind);
    if (!res.ok) setMsg(`Teste falhou: ${res.error}`);
  };

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

  const update = async <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => {
    const next = { ...settings, [k]: v };
    setSettings(next);
    await window.beefor.setSettings(next);
  };

  const updatePunchTime = async (idx: 0 | 1 | 2 | 3, value: string) => {
    const next = [...settings.punchTimes] as AppSettings['punchTimes'];
    next[idx] = value;
    await update('punchTimes', next);
  };

  const toggleKudocardDay = async (day: number) => {
    const has = settings.kudocardDays.includes(day);
    const next = has
      ? settings.kudocardDays.filter((d) => d !== day)
      : [...settings.kudocardDays, day].sort((a, b) => a - b);
    await update('kudocardDays', next);
  };

  return (
    <div className="grid cols-2">
      {needsAdmin && admin && !admin.elevated && admin.platform === 'win32' && (
        <div className="admin-banner" style={{ gridColumn: '1 / -1' }}>
          <div>
            <strong>Permissão de administrador necessária</strong>
            <p>
              Notificações e alarmes funcionam melhor com o app rodando como
              administrador. Reinicie elevado para garantir que os avisos toquem
              mesmo com a janela em segundo plano.
            </p>
          </div>
          <button className="warm" onClick={elevateNow}>
            Reiniciar como admin
          </button>
        </div>
      )}
      {needsAdmin && admin && admin.elevated && (
        <div
          className="admin-banner ok"
          style={{ gridColumn: '1 / -1' }}
        >
          <strong>App rodando como administrador ✓</strong>
        </div>
      )}

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
          <button className="danger" onClick={clear}>Remover</button>
        </div>
        {savedEmail && (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 12 }}>
            Salvo: <strong>{savedEmail}</strong>
          </p>
        )}
        {msg && <p style={{ color: 'var(--accent-2)', fontSize: 13, marginTop: 8 }}>{msg}</p>}
      </div>

      <div className="card">
        <h2>Inicialização</h2>
        <div className="checkbox-row" style={{ marginBottom: 12 }}>
          <input
            id="autostart"
            type="checkbox"
            checked={settings.autoStart}
            onChange={(e) => update('autoStart', e.target.checked)}
          />
          <label htmlFor="autostart">Abrir ao iniciar o PC</label>
        </div>
        <div className="checkbox-row">
          <input
            id="autologin"
            type="checkbox"
            checked={settings.autoLoginOnLaunch}
            onChange={(e) => update('autoLoginOnLaunch', e.target.checked)}
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
            onChange={(e) => update('hoursPerDay', Number(e.target.value) || 0)}
          />
        </div>
        <div className="field">
          <label className="label">Valor da hora (R$)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={settings.hourRate}
            onChange={(e) => update('hourRate', Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Automatizar batida de ponto</h2>
          <button className="secondary compact" onClick={() => testNotif('punch')}>
            Testar
          </button>
        </div>
        <div className="checkbox-row" style={{ marginBottom: 12 }}>
          <input
            id="automatePunch"
            type="checkbox"
            checked={settings.automatePunch}
            onChange={(e) => update('automatePunch', e.target.checked)}
          />
          <label htmlFor="automatePunch">Ativar batida automática</label>
        </div>
        <div className="punch-grid">
          {PUNCH_LABELS.map((lab, i) => (
            <div className="field" key={lab}>
              <label className="label">{lab}</label>
              <input
                type="time"
                disabled={!settings.automatePunch}
                value={settings.punchTimes[i] ?? ''}
                onChange={(e) => updatePunchTime(i as 0 | 1 | 2 | 3, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="field" style={{ marginTop: 10 }}>
          <label className="label">
            Variação aleatória diária (± minutos)
          </label>
          <input
            type="number"
            min={0}
            max={60}
            disabled={!settings.automatePunch}
            value={settings.punchDriftMinutes}
            onChange={(e) =>
              update('punchDriftMinutes', Math.max(0, Number(e.target.value) || 0))
            }
          />
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
            Cada dia recebe um deslocamento aleatório (em minutos) somado/subtraído
            de cada horário base, pra simular variação natural.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Mood</h2>
          <button className="secondary compact" onClick={() => testNotif('mood')}>
            Testar
          </button>
        </div>
        <div className="checkbox-row" style={{ marginBottom: 12 }}>
          <input
            id="moodNotification"
            type="checkbox"
            checked={settings.moodNotification}
            onChange={(e) => update('moodNotification', e.target.checked)}
          />
          <label htmlFor="moodNotification">Notificação diária de mood</label>
        </div>
        <div className="checkbox-row" style={{ marginBottom: 12 }}>
          <input
            id="moodAlarm"
            type="checkbox"
            checked={settings.moodAlarm}
            onChange={(e) => update('moodAlarm', e.target.checked)}
          />
          <label htmlFor="moodAlarm">Tocar alarme com a notificação</label>
        </div>
        <div className="field">
          <label className="label">Horário</label>
          <input
            type="time"
            disabled={!settings.moodNotification && !settings.moodAlarm}
            value={settings.moodNotificationTime}
            onChange={(e) => update('moodNotificationTime', e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Almoço</h2>
          <button className="secondary compact" onClick={() => testNotif('lunch')}>
            Testar
          </button>
        </div>
        <div className="checkbox-row" style={{ marginBottom: 12 }}>
          <input
            id="lunchAlarm"
            type="checkbox"
            checked={settings.lunchAlarm}
            onChange={(e) => update('lunchAlarm', e.target.checked)}
          />
          <label htmlFor="lunchAlarm">Alarme de almoço</label>
        </div>
        <div className="field">
          <label className="label">Horário do alarme</label>
          <input
            type="time"
            disabled={!settings.lunchAlarm}
            value={settings.lunchAlarmTime}
            onChange={(e) => update('lunchAlarmTime', e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="row between" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Kudocard</h2>
          <button className="secondary compact" onClick={() => testNotif('kudocard')}>
            Testar
          </button>
        </div>
        <div className="checkbox-row" style={{ marginBottom: 12 }}>
          <input
            id="kudocardNotification"
            type="checkbox"
            checked={settings.kudocardNotification}
            onChange={(e) => update('kudocardNotification', e.target.checked)}
          />
          <label htmlFor="kudocardNotification">
            Notificação para enviar kudocard
          </label>
        </div>
        <div className="kudocard-freq" style={{ opacity: settings.kudocardNotification ? 1 : 0.5 }}>
          {(['once', 'twice', 'custom'] as KudocardFrequency[]).map((f) => (
            <label key={f} className="kudocard-freq__opt">
              <input
                type="radio"
                name="kudocardFreq"
                checked={settings.kudocardFrequency === f}
                disabled={!settings.kudocardNotification}
                onChange={() => update('kudocardFrequency', f)}
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
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <button
                key={d}
                type="button"
                className={`day-chip ${settings.kudocardDays.includes(d) ? 'active' : ''}`}
                disabled={!settings.kudocardNotification}
                onClick={() => toggleKudocardDay(d)}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h2>Segurança</h2>
        <ul style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.8 }}>
          <li>Senha gravada no Windows Credential Manager (via keytar).</li>
          <li>Cookies / localStorage do Beefor salvos em <code>storageState</code> isolado.</li>
          <li>MFA / CAPTCHA pedem login manual — app não burla autenticação.</li>
          <li>Use “Remover” ao trocar de máquina ou ao sair.</li>
        </ul>
      </div>
    </div>
  );
}

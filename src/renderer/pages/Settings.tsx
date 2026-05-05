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
  patchJournal:
    '- v0.1.0: base de lancamentos e mood.\n- v0.1.1: melhorias visuais e alertas.',
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
    (settings.automatePunch ||
      settings.lunchAlarm ||
      settings.moodAlarm ||
      settings.moodNotification ||
      settings.kudocardNotification) &&
    !settings.adminBannerDismissed;

  const elevateNow = async () => {
    const res = await window.beefor.relaunchAsAdmin();
    if (!res.ok) setMsg(`Falha ao elevar: ${res.error}`);
  };

  const dismissAdminBanner = () => update('adminBannerDismissed', true);

  const changeViewMode = async (mode: 'classic' | 'minimal') => {
    if ((settings.viewMode ?? 'classic') === mode) return;
    const next = { ...settings, viewMode: mode };
    setSettings(next);
    await window.beefor.setSettings(next);
    setMsg('Reiniciando para aplicar...');
    setTimeout(() => void window.beefor.relaunchApp(), 400);
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
    <div className="settings-page">
      {needsAdmin && admin && !admin.elevated && admin.platform === 'win32' && (
        <div className="admin-banner">
          <div>
            <strong>Alarmes funcionam melhor como administrador</strong>
            <p>
              Opcional — reinicie elevado se os alarmes não tocarem em segundo plano.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="warm" onClick={elevateNow}>
              Reiniciar como admin
            </button>
            <button
              className="secondary compact"
              onClick={dismissAdminBanner}
              title="Não mostrar novamente"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <section className="settings-section">
        <h3 className="settings-section__title">GERAL</h3>
        <p className="settings-section__hint">CREDENCIAIS | INICIALIZAÇÃO | JORNADA</p>
        <div className="settings-grid grid-3">
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
        </div>
      </section>

      <section className="settings-section">
        <h3 className="settings-section__title">ALERTAS / AUTOMAÇÃO</h3>
        <p className="settings-section__hint">
          AUTOMATIZAR BATIDA DE PONTO | ALERTA DE MOOD | ALERTA ALMOÇO | ALERTA KUDOCARD
        </p>
        <div className="settings-grid grid-2">
      <div className="card">
        <div className="row between" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>AUTOMATIZAR BATIDA DE PONTO</h2>
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
          <h2 style={{ margin: 0 }}>Alerta de MOOD</h2>
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
          <h2 style={{ margin: 0 }}>Alerta ALMOÇO</h2>
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

      <div className="card kudocard-card">
        <div className="row between" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Alerta KUDOCARD</h2>
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
        </div>
      </section>

      <section className="settings-section">
        <h3 className="settings-section__title">PERSONALIZAÇÃO</h3>
        <p className="settings-section__hint">VISUALIZAÇÃO</p>
        <div className="settings-grid grid-1">
          <div className="card">
            <h2>Visualização</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 12px' }}>
              Troca aplica reiniciando o app automaticamente.
            </p>
            <div className="view-mode-row">
              <button
                type="button"
                className={`view-mode-opt ${(settings.viewMode ?? 'classic') === 'classic' ? 'active' : ''}`}
                onClick={() => void changeViewMode('classic')}
              >
                <svg className="vm-preview" viewBox="0 0 120 70" aria-hidden="true">
                  <rect x="4" y="4" width="112" height="10" rx="2" fill="var(--bg-3)" />
                  <rect x="4" y="18" width="112" height="6" rx="1" fill="var(--accent-soft)" />
                  <rect x="4" y="28" width="112" height="6" rx="1" fill="var(--bg-3)" />
                  <rect x="4" y="38" width="112" height="6" rx="1" fill="var(--bg-3)" />
                  <rect x="4" y="48" width="112" height="6" rx="1" fill="var(--bg-3)" />
                  <rect x="4" y="58" width="112" height="6" rx="1" fill="var(--bg-3)" />
                </svg>
                <strong>Clássica</strong>
                <span>Tabela linha-a-linha com todos os dias</span>
              </button>
              <button
                type="button"
                className={`view-mode-opt ${settings.viewMode === 'minimal' ? 'active' : ''}`}
                onClick={() => void changeViewMode('minimal')}
              >
                <svg className="vm-preview" viewBox="0 0 120 70" aria-hidden="true">
                  <rect x="4" y="4" width="54" height="62" rx="3" fill="var(--bg-3)" />
                  {[0, 1, 2, 3].map((row) =>
                    [0, 1, 2, 3, 4].map((col) => (
                      <rect
                        key={`${row}-${col}`}
                        x={7 + col * 10}
                        y={9 + row * 14}
                        width="8"
                        height="11"
                        rx="1.5"
                        fill={row === 1 && col === 2 ? 'var(--accent)' : 'var(--bg-2)'}
                      />
                    )),
                  )}
                  <rect x="62" y="4" width="54" height="62" rx="3" fill="var(--bg-3)" />
                  <rect x="66" y="9" width="30" height="6" rx="1" fill="var(--accent-soft)" />
                  <rect x="66" y="20" width="46" height="5" rx="1" fill="var(--bg-2)" />
                  <rect x="66" y="28" width="46" height="5" rx="1" fill="var(--bg-2)" />
                  <rect x="66" y="36" width="46" height="5" rx="1" fill="var(--bg-2)" />
                  <rect x="66" y="50" width="20" height="10" rx="2" fill="var(--accent)" />
                </svg>
                <strong>Minimalista</strong>
                <span>Calendário + dia selecionado</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="card settings-security">
        <h2>Segurança</h2>
        <ul style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.8 }}>
          <li>Senha gravada no Windows Credential Manager (via keytar).</li>
          <li>Cookies / localStorage do Beefor salvos em <code>storageState</code> isolado.</li>
          <li>MFA / CAPTCHA pedem login manual — app não burla autenticação.</li>
          <li>Use — app não burla autenticação.</li>
        </ul>
      </div>
    </div>
  );
}

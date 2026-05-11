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
  patchJournal: '',
  uiSounds: false,
};

const PUNCH_LABELS = ['Entrada', 'Saída almoço', 'Retorno', 'Saída'];

interface SettingsProps {
  onSettingsChanged?: () => void;
}

interface SwitchProps {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}

function Switch({ id, checked, onChange, label, disabled }: SwitchProps) {
  return (
    <div className="switch-row" style={{ marginBottom: 10 }}>
      <span className="switch">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="switch__track" />
        <span className="switch__thumb" />
      </span>
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

export function Settings({ onSettingsChanged }: SettingsProps = {}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [msg, setMsg] = useState<string | null>(null);
  const [admin, setAdmin] = useState<{ elevated: boolean; platform: string } | null>(null);
  const [coin2uEmail, setCoin2uEmail] = useState('');
  const [coin2uPassword, setCoin2uPassword] = useState('');
  const [coin2uSavedEmail, setCoin2uSavedEmail] = useState<string | null>(null);
  const [coin2uConnected, setCoin2uConnected] = useState<boolean>(false);

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
    void window.beefor.getCoin2uCreds().then((c) => {
      if (c) {
        setCoin2uSavedEmail(c.email);
        setCoin2uEmail(c.email);
        setCoin2uConnected(!!c.connected);
      }
    });
  }, []);

  const saveCoin2u = async () => {
    if (!coin2uEmail || !coin2uPassword) {
      setMsg('Coin2U: preencha e-mail e senha.');
      return;
    }
    const res = await window.beefor.saveCoin2uCreds({
      email: coin2uEmail,
      password: coin2uPassword,
    });
    if (!res.ok) {
      setMsg(`Erro Coin2U: ${res.error}`);
      return;
    }
    setCoin2uSavedEmail(coin2uEmail);
    setCoin2uPassword('');
    setMsg('Coin2U: credenciais salvas. Testando login…');
    const verify = await window.beefor.verifyCoin2u();
    if (verify.ok && verify.data) {
      setCoin2uConnected(true);
      setMsg('Coin2U: conectado.');
    } else {
      setCoin2uConnected(false);
      setMsg(`Coin2U: login falhou — ${verify.error}`);
    }
    onSettingsChanged?.();
  };

  const testCoin2u = async () => {
    setMsg('Coin2U: testando…');
    const verify = await window.beefor.verifyCoin2u();
    if (verify.ok && verify.data) {
      setCoin2uConnected(true);
      setMsg('Coin2U: conectado.');
      onSettingsChanged?.();
    } else {
      setCoin2uConnected(false);
      setMsg(`Coin2U: ${verify.error}`);
    }
  };

  const clearCoin2u = async () => {
    const res = await window.beefor.clearCoin2uCreds();
    setMsg(res.ok ? 'Credenciais Coin2U removidas.' : `Erro Coin2U: ${res.error}`);
    if (res.ok) {
      setCoin2uSavedEmail(null);
      setCoin2uEmail('');
      setCoin2uPassword('');
      setCoin2uConnected(false);
      onSettingsChanged?.();
    }
  };

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
    onSettingsChanged?.();
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

      {/* ============================================================
          GERAL
          ============================================================ */}
      <section className="settings-section">
        <h3 className="settings-section__title">GERAL</h3>
        <p className="settings-section__hint">CREDENCIAIS | CONFIGURAÇÃO GERAL | JORNADA</p>
        <div className="settings-grid grid-3">

          {/* Credenciais (Beefor + Coin2U) */}
          <div className="card">
            <h2>Credenciais</h2>

            <p className="card-subtitle">Beefor</p>
            <div className="field">
              <label className="label">E-mail</label>
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
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
                Salvo: <strong>{savedEmail}</strong>
              </p>
            )}

            <div className="card-divider" />

            <p className="card-subtitle">Coin2U</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 10px' }}>
              Login separado do Beefor. Mostra suas moedas no topo.
            </p>
            <div className="field">
              <label className="label">E-mail</label>
              <input
                type="email"
                value={coin2uEmail}
                onChange={(e) => setCoin2uEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label className="label">Senha</label>
              <input
                type="password"
                value={coin2uPassword}
                onChange={(e) => setCoin2uPassword(e.target.value)}
                placeholder={coin2uSavedEmail ? '••••••••' : 'sua senha'}
                autoComplete="off"
              />
            </div>
            <div className="row">
              <button onClick={saveCoin2u}>Salvar</button>
              <button className="secondary" onClick={testCoin2u}>Testar</button>
              <button className="danger" onClick={clearCoin2u}>Remover</button>
            </div>
            {coin2uSavedEmail && (
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
                Salvo: <strong>{coin2uSavedEmail}</strong>
                {' · '}
                <span style={{ color: coin2uConnected ? 'var(--ok)' : 'var(--err)' }}>
                  {coin2uConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </p>
            )}
          </div>

          {/* Configuração Geral (inicialização + sons) */}
          <div className="card">
            <h2>Configuração geral</h2>
            <Switch
              id="autostart"
              checked={settings.autoStart}
              onChange={(v) => void update('autoStart', v)}
              label="Abrir ao iniciar o PC"
            />
            <Switch
              id="autologin"
              checked={settings.autoLoginOnLaunch}
              onChange={(v) => void update('autoLoginOnLaunch', v)}
              label="Restaurar sessão ao abrir"
            />
            <Switch
              id="uiSounds"
              checked={settings.uiSounds ?? false}
              onChange={(v) => void update('uiSounds', v)}
              label="Efeitos sonoros da interface"
            />
          </div>

          {/* Jornada */}
          <div className="card">
            <h2>Jornada</h2>
            <div className="field">
              <label className="label">Horas por dia</label>
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

      {/* ============================================================
          ALERTAS / AUTOMAÇÃO
          ============================================================ */}
      <section className="settings-section">
        <h3 className="settings-section__title">ALERTAS / AUTOMAÇÃO</h3>
        <p className="settings-section__hint">
          BATIDA DE PONTO | MOOD | ALMOÇO | KUDOCARD
        </p>
        <div className="settings-grid grid-2">

          {/* Punch */}
          <div className="card">
            <div className="row between" style={{ marginBottom: 8 }}>
              <h2 style={{ margin: 0 }}>AUTOMATIZAR BATIDA DE PONTO</h2>
              <button className="secondary compact" onClick={() => testNotif('punch')}>
                Testar
              </button>
            </div>
            <Switch
              id="automatePunch"
              checked={settings.automatePunch}
              onChange={(v) => void update('automatePunch', v)}
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

          {/* Mood */}
          <div className="card">
            <div className="row between" style={{ marginBottom: 8 }}>
              <h2 style={{ margin: 0 }}>Alerta de MOOD</h2>
              <button className="secondary compact" onClick={() => testNotif('mood')}>
                Testar
              </button>
            </div>
            <Switch
              id="moodNotification"
              checked={settings.moodNotification}
              onChange={(v) => void update('moodNotification', v)}
              label="Notificação diária de mood"
            />
            <Switch
              id="moodAlarm"
              checked={settings.moodAlarm}
              onChange={(v) => void update('moodAlarm', v)}
              label="Tocar alarme com a notificação"
            />
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

          {/* Lunch */}
          <div className="card">
            <div className="row between" style={{ marginBottom: 8 }}>
              <h2 style={{ margin: 0 }}>Alerta ALMOÇO</h2>
              <button className="secondary compact" onClick={() => testNotif('lunch')}>
                Testar
              </button>
            </div>
            <Switch
              id="lunchAlarm"
              checked={settings.lunchAlarm}
              onChange={(v) => void update('lunchAlarm', v)}
              label="Alarme de almoço"
            />
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

          {/* KudoCard */}
          <div className="card kudocard-card">
            <div className="row between" style={{ marginBottom: 8 }}>
              <h2 style={{ margin: 0 }}>Alerta KUDOCARD</h2>
              <button className="secondary compact" onClick={() => testNotif('kudocard')}>
                Testar
              </button>
            </div>
            <Switch
              id="kudocardNotification"
              checked={settings.kudocardNotification}
              onChange={(v) => void update('kudocardNotification', v)}
              label="Notificação para enviar kudocard"
            />
            <div className="field" style={{ marginTop: 6 }}>
              <label className="label">Horário (opcional — vazio = aleatório)</label>
              <input
                type="time"
                disabled={!settings.kudocardNotification}
                value={settings.kudocardNotificationTime ?? ''}
                onChange={(e) => update('kudocardNotificationTime', e.target.value || undefined)}
              />
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
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
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

      {/* ============================================================
          PERSONALIZAÇÃO / APARÊNCIA
          ============================================================ */}
      <section className="settings-section">
        <h3 className="settings-section__title">PERSONALIZAÇÃO / APARÊNCIA</h3>
        <p className="settings-section__hint">VISUALIZAÇÃO | DENSIDADE | EDITOR DE TEMA | LOGO</p>
        <div className="settings-grid grid-1">

          {/* Visualização */}
          <div className="card">
            <h2>Visualização</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 12px' }}>
              Troca aplica reiniciando o app automaticamente.
            </p>
            {settings.viewMode === 'minimal' && (
              <Switch
                id="calendarShowDiff"
                checked={settings.calendarShowDiff ?? false}
                onChange={(v) => void update('calendarShowDiff', v)}
                label="Mostrar saldo diário nas células do calendário"
              />
            )}
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

          {/* Densidade */}
          <div className="card">
            <h2>Densidade da interface</h2>
            <div className="density-row">
              {(['compact', 'normal', 'comfortable'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`density-opt ${(settings.uiDensity ?? 'normal') === d ? 'active' : ''}`}
                  onClick={() => void update('uiDensity', d)}
                >
                  <span className="density-bars">
                    {d === 'compact' && <><i /><i /><i /><i /><i /></>}
                    {d === 'normal' && <><i /><i /><i /></>}
                    {d === 'comfortable' && <><i /><i /></>}
                  </span>
                  <strong>{d === 'compact' ? 'Compacto' : d === 'normal' ? 'Normal' : 'Confortável'}</strong>
                </button>
              ))}
            </div>
          </div>

          {/* Editor de tema */}
          <div className="card">
            <h2>Editor de tema</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 14px' }}>
              Personaliza cores e visual. Deixe vazio para usar o padrão.
            </p>
            <div className="theme-editor-grid">
              {([
                { key: 'accent', label: 'Cor de destaque', placeholder: '#7c5cbf' },
                { key: 'warm', label: 'Cor quente', placeholder: '#e6a817' },
                { key: 'ok', label: 'Cor de sucesso', placeholder: '#27b899' },
                { key: 'err', label: 'Cor de erro', placeholder: '#e05470' },
              ] as const).map(({ key, label, placeholder }) => (
                <div className="theme-editor-field" key={key}>
                  <label className="label">{label}</label>
                  <div className="theme-color-wrap">
                    <input
                      type="color"
                      className="theme-color-picker"
                      value={(settings.themeOverrides?.[key]) || placeholder}
                      onChange={(e) => void update('themeOverrides', {
                        ...settings.themeOverrides,
                        [key]: e.target.value,
                      })}
                    />
                    <input
                      type="text"
                      value={settings.themeOverrides?.[key] ?? ''}
                      placeholder={placeholder}
                      onChange={(e) => void update('themeOverrides', {
                        ...settings.themeOverrides,
                        [key]: e.target.value || undefined,
                      })}
                    />
                  </div>
                </div>
              ))}
              <div className="theme-editor-field">
                <label className="label">Raio de borda</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={1}
                    value={parseInt(settings.themeOverrides?.radius ?? '10')}
                    style={{ flex: 1, minHeight: 'auto', padding: 0 }}
                    onChange={(e) => void update('themeOverrides', {
                      ...settings.themeOverrides,
                      radius: `${e.target.value}px`,
                    })}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 32 }}>
                    {settings.themeOverrides?.radius ?? '10px'}
                  </span>
                </div>
              </div>
              <div className="theme-editor-field">
                <label className="label">Tamanho de fonte</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="range"
                    min={0.8}
                    max={1.3}
                    step={0.05}
                    value={parseFloat(settings.themeOverrides?.fontScale ?? '1')}
                    style={{ flex: 1, minHeight: 'auto', padding: 0 }}
                    onChange={(e) => void update('themeOverrides', {
                      ...settings.themeOverrides,
                      fontScale: e.target.value,
                    })}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 32 }}>
                    {Math.round(parseFloat(settings.themeOverrides?.fontScale ?? '1') * 100)}%
                  </span>
                </div>
              </div>
            </div>
            <button
              className="secondary compact"
              style={{ marginTop: 12 }}
              onClick={() => void update('themeOverrides', {})}
            >
              Resetar tema
            </button>
          </div>

          {/* Logo */}
          <div className="card">
            <h2>Logo do app</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 12px' }}>
              Escolha a variante de cor da logo. Aplica na titlebar e ícone da bandeja.
            </p>
            <div className="logo-variant-row">
              <button
                type="button"
                className={`logo-variant-opt ${(settings.logoVariant ?? 'orange') === 'orange' ? 'active' : ''}`}
                onClick={() => void update('logoVariant', 'orange')}
              >
                <span className="logo-variant-swatch" style={{ background: '#e6a817' }} />
                <strong>Laranja</strong>
                <span>Padrão</span>
              </button>
              <button
                type="button"
                className={`logo-variant-opt ${settings.logoVariant === 'purple' ? 'active' : ''}`}
                onClick={() => void update('logoVariant', 'purple')}
              >
                <span className="logo-variant-swatch" style={{ background: '#7c5cbf' }} />
                <strong>Roxo</strong>
                <span>Alternativo</span>
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
        </ul>
      </div>

      {msg && (
        <div className="settings-toast" role="status">
          {msg}
        </div>
      )}
    </div>
  );
}

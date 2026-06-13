import { useState } from 'react';
import { ModalShell } from '../../components/ui/ModalShell';
import { BeeforLogo } from '../../components/common/BeeforLogo';
import { useIpc } from '../../services/ipc';
import { useToast } from '../providers/ToastProvider';
import type { AppSettings } from '@shared/types/index';
import { SETTINGS_DEFAULTS, PUNCH_LABELS } from '../../pages/settings/defaults';
import { getError } from '@shared/result';
import { THEME_PRESETS } from '../../features/gamification/themePresets';
import { Switch } from '../../pages/settings/Switch';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = 'credentials' | 'coin2u' | 'punch' | 'alarms' | 'theme';

const STEPS: Step[] = ['credentials', 'coin2u', 'punch', 'alarms', 'theme'];

const STEP_TITLES: Record<Step, string> = {
  credentials: 'Credenciais do Beefor',
  coin2u: 'Credenciais do Coin2U',
  punch: 'Horários de ponto',
  alarms: 'Alarmes e notificações',
  theme: 'Escolha um tema',
};

const FREE_THEMES = THEME_PRESETS.filter((p) => p.requires === null && !p.hidden);

export function OnboardingModal({ open, onClose }: Props) {
  const {
    session: sessionClient,
    settings: settingsClient,
    coin2u: coin2uClient,
    system: systemClient,
  } = useIpc();
  const showToast = useToast();

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginOk, setLoginOk] = useState(false);
  const [coin2uEmail, setCoin2uEmail] = useState('');
  const [coin2uPassword, setCoin2uPassword] = useState('');
  const [punchTimes, setPunchTimes] = useState<AppSettings['punchTimes']>(
    SETTINGS_DEFAULTS.punchTimes,
  );
  const [drift, setDrift] = useState(SETTINGS_DEFAULTS.punchDriftMinutes);
  const [moodNotification, setMoodNotification] = useState(false);
  const [moodAlarm, setMoodAlarm] = useState(false);
  const [moodNotificationTime, setMoodNotificationTime] = useState(
    SETTINGS_DEFAULTS.moodNotificationTime,
  );
  const [lunchAlarm, setLunchAlarm] = useState(false);
  const [lunchAlarmTime, setLunchAlarmTime] = useState(SETTINGS_DEFAULTS.lunchAlarmTime);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('default');
  const [saving, setSaving] = useState(false);

  const currentStepIndex = STEPS.indexOf(step);
  const stepLabel = `Passo ${currentStepIndex + 1} de ${STEPS.length}`;

  const markOnboarded = async () => {
    const current = await settingsClient.get();
    await settingsClient.set({ ...current, onboarded: true });
  };

  const handleDismiss = async () => {
    await markOnboarded();
    onClose();
  };

  const handleCredentialsNext = async () => {
    setLoginError(null);
    if (!email || !password) {
      setStep('coin2u');
      return;
    }
    setSaving(true);
    const saveRes = await sessionClient.saveCredentials({ email, password });
    if (!saveRes.ok) {
      setSaving(false);
      setLoginError(`Erro ao salvar: ${getError(saveRes)}`);
      showToast({ kind: 'err', msg: `Erro ao salvar credenciais: ${getError(saveRes)}` });
      return;
    }
    const loginRes = await sessionClient.login();
    setSaving(false);
    if (!loginRes.ok) {
      setLoginError(
        `Login falhou — verifique e-mail e senha. Você pode corrigir depois em Configurações → Segurança.`,
      );
      showToast({ kind: 'err', msg: `Login Beefor falhou: ${getError(loginRes)}` });
      setLoginOk(false);
      return;
    }
    setLoginOk(true);
    setLoginError(null);
    setStep('coin2u');
  };

  const handleCoin2uNext = async () => {
    if (!coin2uEmail || !coin2uPassword) {
      setStep('punch');
      return;
    }
    setSaving(true);
    const res = await coin2uClient.saveCreds({ email: coin2uEmail, password: coin2uPassword });
    setSaving(false);
    if (!res.ok) {
      showToast({ kind: 'err', msg: `Erro ao salvar Coin2U: ${getError(res)}` });
      return;
    }
    setStep('punch');
  };

  const handleFinish = async () => {
    setSaving(true);
    const current = await settingsClient.get();
    await settingsClient.set({
      ...current,
      punchTimes,
      punchDriftMinutes: drift,
      moodNotification,
      moodAlarm,
      moodNotificationTime,
      lunchAlarm,
      lunchAlarmTime,
      themePresetId: selectedThemeId,
      onboarded: true,
    });
    setSaving(false);
    showToast({ kind: 'ok', msg: 'Configuração concluída! Reiniciando...' });
    setTimeout(() => void systemClient.relaunchApp(), 600);
  };

  const updatePunchTime = (idx: number, value: string) => {
    const next = [...punchTimes] as AppSettings['punchTimes'];
    next[idx] = value;
    setPunchTimes(next);
  };

  return (
    <ModalShell
      open={open}
      onClose={() => void handleDismiss()}
      className="onboarding-modal"
      labelledBy="onboarding-title"
    >
      <div className="modal-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BeeforLogo size={28} style={{ color: 'var(--warm)' }} />
          <div>
            <p className="eyebrow">{stepLabel}</p>
            <h2 id="onboarding-title">{STEP_TITLES[step]}</h2>
          </div>
        </div>
        <button
          type="button"
          className="secondary compact"
          onClick={() => void handleDismiss()}
          data-sound="close"
        >
          Pular tudo
        </button>
      </div>

      <div className="profile-modal__body">
        {/* ── Passo 1: Credenciais Beefor ── */}
        {step === 'credentials' && (
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Informe suas credenciais do Beefor. O app tentará fazer login automaticamente.
            </p>
            <div className="field">
              <label className="label">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLoginError(null);
                }}
                placeholder="seu@email.com"
                autoComplete="username"
                autoFocus
              />
            </div>
            <div className="field">
              <label className="label">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError(null);
                }}
                placeholder="sua senha"
                autoComplete="current-password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCredentialsNext();
                }}
              />
            </div>
            {loginOk && (
              <p style={{ color: 'var(--ok)', fontSize: 13, marginTop: 8 }}>
                ✓ Login realizado com sucesso!
              </p>
            )}
            {loginError && (
              <p style={{ color: 'var(--err)', fontSize: 13, marginTop: 8 }}>{loginError}</p>
            )}
            <div className="row" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => void handleCredentialsNext()}
                disabled={saving}
                data-sound="click"
              >
                {saving ? 'Verificando login…' : loginError ? 'Tentar novamente →' : 'Próximo →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Passo 2: Credenciais Coin2U ── */}
        {step === 'coin2u' && (
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Login do Coin2U (separado do Beefor). Mostra suas moedas no topo. Pode preencher
              depois em <strong>Configurações → Segurança</strong>.
            </p>
            <div className="field">
              <label className="label">E-mail</label>
              <input
                type="email"
                value={coin2uEmail}
                onChange={(e) => setCoin2uEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="off"
                autoFocus
              />
            </div>
            <div className="field">
              <label className="label">Senha</label>
              <input
                type="password"
                value={coin2uPassword}
                onChange={(e) => setCoin2uPassword(e.target.value)}
                placeholder="sua senha"
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCoin2uNext();
                }}
              />
            </div>
            <div className="row" style={{ marginTop: 20, justifyContent: 'space-between' }}>
              <button
                type="button"
                className="secondary"
                onClick={() => setStep('credentials')}
                data-sound="click"
              >
                ← Voltar
              </button>
              <button
                type="button"
                onClick={() => void handleCoin2uNext()}
                disabled={saving}
                data-sound="click"
              >
                {saving ? 'Salvando…' : 'Próximo →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Passo 3: Horários de ponto ── */}
        {step === 'punch' && (
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Configure seus horários base de ponto. O app pode lançar automaticamente com uma
              variação aleatória.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px 16px',
                marginBottom: 16,
              }}
            >
              {PUNCH_LABELS.map((label, i) => (
                <div className="field" key={i}>
                  <label className="label">{label}</label>
                  <input
                    type="time"
                    value={punchTimes[i]}
                    onChange={(e) => updatePunchTime(i, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="field">
              <label className="label">Variação aleatória: {drift} min</label>
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={drift}
                onChange={(e) => setDrift(Number(e.target.value))}
              />
            </div>
            <div className="row" style={{ marginTop: 20, justifyContent: 'space-between' }}>
              <button
                type="button"
                className="secondary"
                onClick={() => setStep('coin2u')}
                data-sound="click"
              >
                ← Voltar
              </button>
              <button type="button" onClick={() => setStep('alarms')} data-sound="click">
                Próximo →
              </button>
            </div>
          </div>
        )}

        {/* ── Passo 4: Alarmes e notificações ── */}
        {step === 'alarms' && (
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Configure os avisos do app. Tudo pode ser ajustado depois em{' '}
              <strong>Configurações → Alertas</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="card" style={{ padding: '12px 14px' }}>
                <strong style={{ fontSize: 13, marginBottom: 8, display: 'block' }}>
                  Mood do dia
                </strong>
                <Switch
                  id="ob-moodNotification"
                  checked={moodNotification}
                  onChange={setMoodNotification}
                  label="Notificação diária de mood"
                />
                <Switch
                  id="ob-moodAlarm"
                  checked={moodAlarm}
                  onChange={setMoodAlarm}
                  label="Tocar alarme com a notificação"
                />
                <div className="field" style={{ marginTop: 8 }}>
                  <label className="label">Horário do lembrete</label>
                  <input
                    type="time"
                    value={moodNotificationTime}
                    disabled={!moodNotification && !moodAlarm}
                    onChange={(e) => setMoodNotificationTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="card" style={{ padding: '12px 14px' }}>
                <strong style={{ fontSize: 13, marginBottom: 8, display: 'block' }}>Almoço</strong>
                <Switch
                  id="ob-lunchAlarm"
                  checked={lunchAlarm}
                  onChange={setLunchAlarm}
                  label="Lembrete de horário de almoço"
                />
                <div className="field" style={{ marginTop: 8 }}>
                  <label className="label">Horário do almoço</label>
                  <input
                    type="time"
                    value={lunchAlarmTime}
                    disabled={!lunchAlarm}
                    onChange={(e) => setLunchAlarmTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="row" style={{ marginTop: 20, justifyContent: 'space-between' }}>
              <button
                type="button"
                className="secondary"
                onClick={() => setStep('punch')}
                data-sound="click"
              >
                ← Voltar
              </button>
              <button type="button" onClick={() => setStep('theme')} data-sound="click">
                Próximo →
              </button>
            </div>
          </div>
        )}

        {/* ── Passo 5: Tema ── */}
        {step === 'theme' && (
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Escolha um tema inicial. Mais temas são desbloqueados via conquistas em{' '}
              <strong>Configurações → Aparência</strong>.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: 8,
                marginBottom: 16,
              }}
            >
              {FREE_THEMES.map((preset) => {
                const active = selectedThemeId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`theme-preset ${active ? 'theme-preset--active' : ''}`}
                    onClick={() => setSelectedThemeId(preset.id)}
                    data-sound="click"
                  >
                    <span className="theme-preset__swatches" aria-hidden="true">
                      {preset.swatches.map((c, i) => (
                        <span key={i} className="theme-preset__swatch" style={{ background: c }} />
                      ))}
                    </span>
                    <strong>{preset.name}</strong>
                    <small>{preset.description}</small>
                  </button>
                );
              })}
            </div>
            <div className="row" style={{ marginTop: 20, justifyContent: 'space-between' }}>
              <button
                type="button"
                className="secondary"
                onClick={() => setStep('alarms')}
                data-sound="click"
              >
                ← Voltar
              </button>
              <button
                type="button"
                onClick={() => void handleFinish()}
                disabled={saving}
                data-sound="click"
              >
                {saving ? 'Salvando…' : 'Concluir ✓'}
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

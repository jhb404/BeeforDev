import { useState } from 'react';
import { ModalShell } from '../../components/ui/ModalShell';
import { BeeforLogo } from '../../components/common/BeeforLogo';
import { useIpc } from '../../services/ipc';
import { useToast } from '../providers/ToastProvider';
import type { AppSettings } from '@shared/types/index';
import { SETTINGS_DEFAULTS, PUNCH_LABELS } from '../../pages/settings/defaults';
import { getError } from '@shared/result';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = 'credentials' | 'punch';

export function OnboardingModal({ open, onClose }: Props) {
  const { session: sessionClient, settings: settingsClient } = useIpc();
  const showToast = useToast();

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [punchTimes, setPunchTimes] = useState<AppSettings['punchTimes']>(
    SETTINGS_DEFAULTS.punchTimes,
  );
  const [drift, setDrift] = useState(SETTINGS_DEFAULTS.punchDriftMinutes);
  const [saving, setSaving] = useState(false);

  const markOnboarded = async () => {
    const current = await settingsClient.get();
    await settingsClient.set({ ...current, onboarded: true });
  };

  const handleDismiss = async () => {
    await markOnboarded();
    onClose();
  };

  const handleCredentialsNext = async () => {
    if (!email || !password) {
      setStep('punch');
      return;
    }
    setSaving(true);
    const res = await sessionClient.saveCredentials({ email, password });
    setSaving(false);
    if (!res.ok) {
      showToast({ kind: 'err', msg: `Erro ao salvar credenciais: ${getError(res)}` });
      return;
    }
    setStep('punch');
  };

  const handleFinish = async () => {
    setSaving(true);
    const current = await settingsClient.get();
    await settingsClient.set({ ...current, punchTimes, punchDriftMinutes: drift, onboarded: true });
    setSaving(false);
    onClose();
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
            <p className="eyebrow">{step === 'credentials' ? 'Passo 1 de 2' : 'Passo 2 de 2'}</p>
            <h2 id="onboarding-title">
              {step === 'credentials' ? 'Credenciais do Beefor' : 'Horários de ponto'}
            </h2>
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
        {step === 'credentials' && (
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Informe suas credenciais do Beefor para o app funcionar. Você pode preencher depois em{' '}
              <strong>Configurações → Segurança</strong>.
            </p>
            <div className="field">
              <label className="label">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="sua senha"
                autoComplete="current-password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCredentialsNext();
                }}
              />
            </div>
            <div className="row" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => void handleCredentialsNext()}
                disabled={saving}
                data-sound="click"
              >
                {saving ? 'Salvando…' : 'Próximo →'}
              </button>
            </div>
          </div>
        )}

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
                onClick={() => setStep('credentials')}
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

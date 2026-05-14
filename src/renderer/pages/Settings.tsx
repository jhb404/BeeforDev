import { useEffect, useState } from 'react';
import { useToast } from '../app/providers/ToastProvider';
import { coin2uClient, sessionClient, settingsClient, systemClient } from '../services/ipc';
import type { AppSettings } from '@shared/types';
import { SETTINGS_DEFAULTS } from './settings/defaults';
import { AdminBanner } from './settings/sections/AdminBanner';
import { AppearanceSection } from './settings/sections/AppearanceSection';
import { CredentialsCard } from './settings/sections/CredentialsCard';
import { GeneralCard } from './settings/sections/GeneralCard';
import { JornadaCard } from './settings/sections/JornadaCard';
import { KudoCardSettings } from './settings/sections/KudoCardSettings';
import { LunchCard } from './settings/sections/LunchCard';
import { MoodCard } from './settings/sections/MoodCard';
import { PunchCard } from './settings/sections/PunchCard';
import { SecurityCard } from './settings/sections/SecurityCard';
import { TrayMenuCard } from './settings/sections/TrayMenuCard';
import { getError } from '@shared/result';

interface SettingsProps {
  onSettingsChanged?: () => void;
}

type SettingsCategory = 'geral' | 'alertas' | 'aparencia' | 'seguranca';

const CATEGORIES: Array<{ id: SettingsCategory; label: string; icon: string; hint: string }> = [
  { id: 'geral', label: 'Geral', icon: '⚙️', hint: 'Configuração geral, jornada, tray' },
  { id: 'alertas', label: 'Alertas', icon: '🔔', hint: 'Ponto, mood, almoço, KudoCard' },
  { id: 'aparencia', label: 'Aparência', icon: '🎨', hint: 'Tema, densidade, layout' },
  { id: 'seguranca', label: 'Segurança', icon: '🔒', hint: 'Credenciais, Coin2U, sessão' },
];

export function Settings({ onSettingsChanged }: SettingsProps = {}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(SETTINGS_DEFAULTS);
  const showToast = useToast();
  const [admin, setAdmin] = useState<{ elevated: boolean; platform: string } | null>(null);
  const [coin2uEmail, setCoin2uEmail] = useState('');
  const [coin2uPassword, setCoin2uPassword] = useState('');
  const [coin2uSavedEmail, setCoin2uSavedEmail] = useState<string | null>(null);
  const [coin2uConnected, setCoin2uConnected] = useState<boolean>(false);
  const [category, setCategory] = useState<SettingsCategory>('geral');

  const refreshAdmin = () => void systemClient.getAdminStatus().then(setAdmin);

  useEffect(() => {
    void sessionClient.getCredentials().then((c) => {
      if (c) {
        setSavedEmail(c.email);
        setEmail(c.email);
      }
    });
    void settingsClient.get().then((s) => {
      setSettings({ ...SETTINGS_DEFAULTS, ...s });
    });
    refreshAdmin();
    void coin2uClient.getCreds().then((c) => {
      if (c) {
        setCoin2uSavedEmail(c.email);
        setCoin2uEmail(c.email);
        setCoin2uConnected(!!c.connected);
      }
    });
  }, []);

  const update = async <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => {
    const next = { ...settings, [k]: v };
    setSettings(next);
    await settingsClient.set(next);
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

  const saveCoin2u = async () => {
    if (!coin2uEmail || !coin2uPassword) {
      showToast({ kind: 'err', msg: 'Coin2U: preencha e-mail e senha.' });
      return;
    }
    const res = await coin2uClient.saveCreds({
      email: coin2uEmail,
      password: coin2uPassword,
    });
    if (!res.ok) {
      showToast({ kind: 'err', msg: `Erro Coin2U: ${getError(res)}` });
      return;
    }
    setCoin2uSavedEmail(coin2uEmail);
    setCoin2uPassword('');
    showToast({ kind: 'ok', msg: 'Coin2U: credenciais salvas. Testando login…' });
    const verify = await coin2uClient.verify();
    if (verify.ok && verify.data) {
      setCoin2uConnected(true);
      showToast({ kind: 'ok', msg: 'Coin2U: conectado.' });
    } else {
      setCoin2uConnected(false);
      showToast({ kind: 'err', msg: `Coin2U: login falhou — ${getError(verify)}` });
    }
    onSettingsChanged?.();
  };

  const testCoin2u = async () => {
    showToast({ kind: 'ok', msg: 'Coin2U: testando…' });
    const verify = await coin2uClient.verify();
    if (verify.ok && verify.data) {
      setCoin2uConnected(true);
      showToast({ kind: 'ok', msg: 'Coin2U: conectado.' });
      onSettingsChanged?.();
    } else {
      setCoin2uConnected(false);
      showToast({ kind: 'err', msg: `Coin2U: ${getError(verify)}` });
    }
  };

  const clearCoin2u = async () => {
    const res = await coin2uClient.clearCreds();
    showToast({
      kind: res.ok ? 'ok' : 'err',
      msg: res.ok ? 'Credenciais Coin2U removidas.' : `Erro Coin2U: ${getError(res)}`,
    });
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
    const res = await systemClient.relaunchAsAdmin();
    if (!res.ok) showToast({ kind: 'err', msg: `Falha ao elevar: ${getError(res)}` });
  };

  const dismissAdminBanner = () => void update('adminBannerDismissed', true);

  const changeViewMode = async (mode: 'classic' | 'minimal') => {
    if ((settings.viewMode ?? 'classic') === mode) return;
    const next = { ...settings, viewMode: mode };
    setSettings(next);
    await settingsClient.set(next);
    showToast({ kind: 'ok', msg: 'Reiniciando para aplicar...' });
    setTimeout(() => void systemClient.relaunchApp(), 400);
  };

  const testNotif = async (kind: 'mood' | 'lunch' | 'kudocard' | 'punch') => {
    const res = await systemClient.testNotification(kind);
    if (!res.ok) showToast({ kind: 'err', msg: `Teste falhou: ${getError(res)}` });
  };

  const save = async () => {
    if (!email || !password) {
      showToast({ kind: 'err', msg: 'Preencha e-mail e senha.' });
      return;
    }
    const res = await sessionClient.saveCredentials({ email, password });
    showToast({
      kind: res.ok ? 'ok' : 'err',
      msg: res.ok ? 'Credenciais salvas no Credential Manager.' : `Erro: ${getError(res)}`,
    });
    if (res.ok) {
      setSavedEmail(email);
      setPassword('');
    }
  };

  const clear = async () => {
    const res = await sessionClient.clearCredentials();
    showToast({
      kind: res.ok ? 'ok' : 'err',
      msg: res.ok ? 'Credenciais removidas.' : `Erro: ${getError(res)}`,
    });
    if (res.ok) {
      setSavedEmail(null);
      setEmail('');
      setPassword('');
    }
  };

  const activeCat = CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0];

  return (
    <div className="settings-page settings-layout">
      <aside className="settings-sidebar">
        <h3 className="settings-sidebar__title">Configurações</h3>
        <nav className="settings-sidebar__nav">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`settings-sidebar__item ${category === cat.id ? 'active' : ''}`}
              onClick={() => setCategory(cat.id)}
              data-sound="tab-settings"
            >
              <span className="settings-sidebar__icon" aria-hidden="true">
                {cat.icon}
              </span>
              <span className="settings-sidebar__label">
                <strong>{cat.label}</strong>
                <small>{cat.hint}</small>
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="settings-content">
        <AdminBanner
          visible={!!(needsAdmin && admin && !admin.elevated && admin.platform === 'win32')}
          onElevate={() => void elevateNow()}
          onDismiss={dismissAdminBanner}
        />

        <header className="settings-content__head">
          <h2>{activeCat.label}</h2>
          <p>{activeCat.hint}</p>
        </header>

        {category === 'geral' && (
          <div className="settings-grid grid-2">
            <GeneralCard settings={settings} onUpdate={update} />
            <JornadaCard settings={settings} onUpdate={update} />
            <TrayMenuCard settings={settings} onUpdate={update} />
          </div>
        )}

        {category === 'alertas' && (
          <div className="settings-grid grid-2">
            <PunchCard
              settings={settings}
              onUpdate={update}
              onUpdatePunchTime={updatePunchTime}
              onTest={() => void testNotif('punch')}
            />
            <MoodCard settings={settings} onUpdate={update} onTest={() => void testNotif('mood')} />
            <LunchCard
              settings={settings}
              onUpdate={update}
              onTest={() => void testNotif('lunch')}
            />
            <KudoCardSettings
              settings={settings}
              onUpdate={update}
              onToggleDay={toggleKudocardDay}
              onTest={() => void testNotif('kudocard')}
            />
          </div>
        )}

        {category === 'aparencia' && (
          <AppearanceSection
            settings={settings}
            onUpdate={update}
            onChangeViewMode={changeViewMode}
          />
        )}

        {category === 'seguranca' && (
          <div className="settings-grid grid-1">
            <CredentialsCard
              email={email}
              password={password}
              savedEmail={savedEmail}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSave={() => void save()}
              onClear={() => void clear()}
              coin2uEmail={coin2uEmail}
              coin2uPassword={coin2uPassword}
              coin2uSavedEmail={coin2uSavedEmail}
              coin2uConnected={coin2uConnected}
              onCoin2uEmailChange={setCoin2uEmail}
              onCoin2uPasswordChange={setCoin2uPassword}
              onCoin2uSave={() => void saveCoin2u()}
              onCoin2uTest={() => void testCoin2u()}
              onCoin2uClear={() => void clearCoin2u()}
            />
            <SecurityCard />
          </div>
        )}
      </div>
    </div>
  );
}

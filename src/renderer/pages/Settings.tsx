import { useEffect, useState } from 'react';
import type { AppSettings } from '../../shared/types';
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

interface SettingsProps {
  onSettingsChanged?: () => void;
}

export function Settings({ onSettingsChanged }: SettingsProps = {}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(SETTINGS_DEFAULTS);
  const [msg, setMsg] = useState<string | null>(null);
  const [admin, setAdmin] = useState<{ elevated: boolean; platform: string } | null>(null);
  const [coin2uEmail, setCoin2uEmail] = useState('');
  const [coin2uPassword, setCoin2uPassword] = useState('');
  const [coin2uSavedEmail, setCoin2uSavedEmail] = useState<string | null>(null);
  const [coin2uConnected, setCoin2uConnected] = useState<boolean>(false);

  const refreshAdmin = () => void window.beefor.getAdminStatus().then(setAdmin);

  useEffect(() => {
    void window.beefor.getCredentials().then((c) => {
      if (c) {
        setSavedEmail(c.email);
        setEmail(c.email);
      }
    });
    void window.beefor.getSettings().then((s) => {
      setSettings({ ...SETTINGS_DEFAULTS, ...s });
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

  const dismissAdminBanner = () => void update('adminBannerDismissed', true);

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

  return (
    <div className="settings-page">
      <AdminBanner
        visible={
          !!(needsAdmin && admin && !admin.elevated && admin.platform === 'win32')
        }
        onElevate={() => void elevateNow()}
        onDismiss={dismissAdminBanner}
      />

      <section className="settings-section">
        <h3 className="settings-section__title">GERAL</h3>
        <p className="settings-section__hint">
          CREDENCIAIS | CONFIGURAÇÃO GERAL | JORNADA
        </p>
        <div className="settings-grid grid-3">
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
          <GeneralCard settings={settings} onUpdate={update} />
          <JornadaCard settings={settings} onUpdate={update} />
        </div>
      </section>

      <section className="settings-section">
        <h3 className="settings-section__title">ALERTAS / AUTOMAÇÃO</h3>
        <p className="settings-section__hint">
          BATIDA DE PONTO | MOOD | ALMOÇO | KUDOCARD
        </p>
        <div className="settings-grid grid-2">
          <PunchCard
            settings={settings}
            onUpdate={update}
            onUpdatePunchTime={updatePunchTime}
            onTest={() => void testNotif('punch')}
          />
          <MoodCard
            settings={settings}
            onUpdate={update}
            onTest={() => void testNotif('mood')}
          />
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
      </section>

      <AppearanceSection
        settings={settings}
        onUpdate={update}
        onChangeViewMode={changeViewMode}
      />

      <SecurityCard />

      {msg && (
        <div className="settings-toast" role="status">
          {msg}
        </div>
      )}
    </div>
  );
}

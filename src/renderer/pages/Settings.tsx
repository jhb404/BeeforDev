import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useToast } from '../app/providers/ToastProvider';
import { useIpc } from '../services/ipc';
import { Bell, Lock, Settings as SettingsIcon } from '../components/common/Icons';
import { AdminBanner } from './settings/sections/AdminBanner';
import { CredentialsCard } from './settings/sections/CredentialsCard';
import { GeneralCard } from './settings/sections/GeneralCard';
import { KudoCardSettings } from './settings/sections/KudoCardSettings';
import { LunchCard } from './settings/sections/LunchCard';
import { MoodCard } from './settings/sections/MoodCard';
import { PunchCard } from './settings/sections/PunchCard';
import { SecurityCard } from './settings/sections/SecurityCard';
import { TrayMenuCard } from './settings/sections/TrayMenuCard';
import { useAdminElevation } from './settings/hooks/useAdminElevation';
import { useAppSettings } from './settings/hooks/useAppSettings';
import { useCoin2uCredentials } from './settings/hooks/useCoin2uCredentials';
import { useSessionCredentials } from './settings/hooks/useSessionCredentials';
import { getError } from '@shared/result';

type SettingsCategory = 'geral' | 'alertas' | 'seguranca';

const CATEGORIES: Array<{
  id: SettingsCategory;
  label: string;
  Icon: LucideIcon;
  hint: string;
}> = [
  { id: 'geral', label: 'Geral', Icon: SettingsIcon, hint: 'Configuração geral, jornada, tray' },
  { id: 'alertas', label: 'Alertas', Icon: Bell, hint: 'Ponto, mood, almoço, KudoCard' },
  { id: 'seguranca', label: 'Segurança', Icon: Lock, hint: 'Credenciais, Coin2U, sessão' },
];

export function Settings() {
  const { system: systemClient } = useIpc();
  const showToast = useToast();
  const [category, setCategory] = useState<SettingsCategory>('geral');

  const session = useSessionCredentials();
  const coin2u = useCoin2uCredentials();
  const elevation = useAdminElevation();
  const { settings, update, updatePunchTime, toggleKudocardDay } = useAppSettings();

  const needsAdmin =
    (settings.automatePunch ||
      settings.lunchAlarm ||
      settings.moodAlarm ||
      settings.moodNotification ||
      settings.kudocardNotification) &&
    !settings.adminBannerDismissed;

  const dismissAdminBanner = () => void update('adminBannerDismissed', true);

  const testNotif = async (kind: 'mood' | 'lunch' | 'kudocard' | 'punch') => {
    const res = await systemClient.testNotification(kind);
    if (!res.ok) showToast({ kind: 'err', msg: `Teste falhou: ${getError(res)}` });
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
                <cat.Icon size={16} />
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
          visible={
            !!(
              needsAdmin &&
              elevation.admin &&
              !elevation.admin.elevated &&
              elevation.admin.platform === 'win32'
            )
          }
          onElevate={() => void elevation.elevateNow()}
          onDismiss={dismissAdminBanner}
        />

        <header className="settings-content__head">
          <h2>{activeCat.label}</h2>
          <p>{activeCat.hint}</p>
        </header>

        {category === 'geral' && (
          <div className="settings-grid grid-2">
            <GeneralCard settings={settings} onUpdate={update} />
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

        {category === 'seguranca' && (
          <div className="settings-grid grid-1">
            <CredentialsCard
              email={session.email}
              password={session.password}
              savedEmail={session.savedEmail}
              onEmailChange={session.setEmail}
              onPasswordChange={session.setPassword}
              onSave={() => void session.save()}
              onClear={() => void session.clear()}
              coin2uEmail={coin2u.email}
              coin2uPassword={coin2u.password}
              coin2uSavedEmail={coin2u.savedEmail}
              coin2uConnected={coin2u.connected}
              onCoin2uEmailChange={coin2u.setEmail}
              onCoin2uPasswordChange={coin2u.setPassword}
              onCoin2uSave={() => void coin2u.save()}
              onCoin2uClear={() => void coin2u.clear()}
            />
            <SecurityCard />
          </div>
        )}
      </div>
    </div>
  );
}

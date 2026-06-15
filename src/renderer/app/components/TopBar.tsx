import { Suspense, lazy, useRef, useState } from 'react';
import { Bell, Globe, Moon, Newspaper, Settings, Sun } from '../../components/common/Icons';
import { TeamButton } from '../../features/team/components/TeamButton';
import type { AppSettings, SessionStatus, TodayAlert } from '@shared/types/index';
import { BellPanel } from './BellPanel';
import { LunchTimerWidget } from './LunchTimerWidget';
import { StatusBadge } from '../../components/common/StatusBadge';
import { UpdateBadge } from './UpdateBadge';
import { BeeforLogo } from '../../components/common/BeeforLogo';
import { useClickOutside } from '../../hooks/useClickOutside';

const Coin2uBadge = lazy(() =>
  import('../../features/coin2u/components/Coin2uBadge').then((m) => ({ default: m.Coin2uBadge })),
);

type Tab = 'home' | 'settings';

interface TopBarProps {
  tab: Tab;
  onTabChange: (t: Tab) => void;
  theme: 'dark' | 'light';
  onToggleTheme: (origin?: { x: number; y: number }) => void;
  alerts: TodayAlert[];
  visibleAlerts: TodayAlert[];
  onAlertDismiss: (index: number) => void;
  onAlertSnooze: (index: number, minutes: number) => void;
  onOpenTeam: () => void;
  onOpenPatchJournal: () => void;
  onOpenProfile: () => void;
  onOpenBeefor: () => void;
  teamPartyBadge: number;
  appSettings: AppSettings | null;
  profileInitials?: string;
  coin2uForceOpen?: boolean;
  onCoin2uForceOpenConsumed?: () => void;
  lunchTimerActive?: boolean;
  lunchStartedAt?: number | null;
  onCancelLunchTimer?: () => void;
  journalBadge?: boolean;
  sessionStatus?: SessionStatus;
}

export function TopBar({
  tab,
  onTabChange,
  theme,
  onToggleTheme,
  alerts,
  visibleAlerts,
  onAlertDismiss,
  onAlertSnooze,
  onOpenTeam,
  onOpenPatchJournal,
  onOpenProfile,
  onOpenBeefor,
  teamPartyBadge,
  appSettings,
  profileInitials,
  coin2uForceOpen,
  onCoin2uForceOpenConsumed,
  lunchTimerActive = false,
  lunchStartedAt = null,
  onCancelLunchTimer,
  journalBadge = false,
  sessionStatus = 'idle',
}: TopBarProps) {
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [gearOpen, setGearOpen] = useState(false);
  const gearRef = useRef<HTMLDivElement>(null);

  useClickOutside(bellRef, () => setBellOpen(false));
  useClickOutside(gearRef, () => setGearOpen(false));

  const onSettings = tab === 'settings';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className={`topbar-home-link ${onSettings ? 'topbar-home-link--back' : 'topbar-home-link--active'}`}
          onClick={() => onTabChange('home')}
          title={onSettings ? 'Voltar ao Início' : 'Início'}
          data-sound="tab-home"
        >
          {onSettings && (
            <span className="topbar-home-link__arrow" aria-hidden="true">
              ←
            </span>
          )}
          <span className="topbar-home-link__label">Início</span>
        </button>
      </div>

      <div className="topbar-actions">
        <LunchTimerWidget
          active={lunchTimerActive}
          startedAt={lunchStartedAt}
          onCancel={onCancelLunchTimer ?? (() => undefined)}
        />

        <button
          type="button"
          className="icon-btn"
          onClick={onOpenBeefor}
          aria-label="Abrir Beefor no navegador"
          title="Abrir Beefor no navegador"
          data-sound="click"
        >
          <Globe size={18} />
        </button>

        <StatusBadge status={sessionStatus} />

        <span className="topbar-divider" aria-hidden="true" />

        <Suspense fallback={null}>
          <Coin2uBadge
            settings={appSettings}
            forceOpen={coin2uForceOpen}
            onForceOpenConsumed={onCoin2uForceOpenConsumed}
          />
        </Suspense>

        <span className="topbar-divider" aria-hidden="true" />

        <TeamButton onOpen={onOpenTeam} partyCount={teamPartyBadge} />

        <div className="bell-wrap" ref={bellRef}>
          <button
            className="icon-btn"
            aria-label="Avisos de hoje"
            onClick={() => setBellOpen((o) => !o)}
          >
            <Bell size={18} />
            {visibleAlerts.length > 0 && <span className="bell-badge">{visibleAlerts.length}</span>}
          </button>
          {bellOpen && (
            <BellPanel
              alerts={alerts}
              visibleAlerts={visibleAlerts}
              onDismiss={(i) => onAlertDismiss(i)}
              onSnooze={(i, m) => onAlertSnooze(i, m)}
              onOpenTeam={() => {
                onOpenTeam();
                setBellOpen(false);
              }}
              onGoToHome={() => {
                onTabChange('home');
                setBellOpen(false);
              }}
            />
          )}
        </div>

        <button
          type="button"
          className="profile-btn"
          aria-label="Meu perfil"
          title="Meu perfil"
          onClick={onOpenProfile}
          data-sound="profile-open"
        >
          <BeeforLogo size={22} className="profile-btn__bee" />
          <span className="profile-btn__init">
            {(profileInitials ?? 'JB').slice(0, 2).toUpperCase()}
          </span>
        </button>

        <span className="topbar-divider" aria-hidden="true" />

        <UpdateBadge />

        <div className="gear-menu-wrap" ref={gearRef}>
          <button
            type="button"
            className={`icon-btn ${gearOpen || onSettings ? 'icon-btn--active' : ''} ${journalBadge ? 'gear-btn--has-news' : ''}`}
            aria-label="Configurações e ajustes"
            aria-haspopup="menu"
            aria-expanded={gearOpen}
            title="Configurações e ajustes"
            onClick={() => setGearOpen((v) => !v)}
          >
            <Settings size={18} />
            {journalBadge && <span className="gear-btn__dot" aria-hidden="true" />}
          </button>
          {gearOpen && (
            <div className="gear-menu" role="menu">
              <button
                role="menuitem"
                className="gear-menu__item"
                data-sound="tab-settings"
                onClick={() => {
                  setGearOpen(false);
                  onTabChange('settings');
                }}
              >
                <span className="gear-menu__icon" aria-hidden="true">
                  <Settings size={16} />
                </span>
                <span>Configurações</span>
              </button>
              <button
                role="menuitem"
                className="gear-menu__item"
                data-sound="theme-toggle"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setGearOpen(false);
                  onToggleTheme({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                  });
                }}
              >
                <span className="gear-menu__icon" aria-hidden="true">
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </span>
                <span>
                  {theme === 'dark' ? 'Trocar para tema claro' : 'Trocar para tema escuro'}
                </span>
              </button>
              <button
                role="menuitem"
                className="gear-menu__item"
                data-sound="journal"
                onClick={() => {
                  setGearOpen(false);
                  onOpenPatchJournal();
                }}
              >
                <span className="gear-menu__icon" aria-hidden="true">
                  <Newspaper size={16} />
                </span>
                <span>Patch notes</span>
                {journalBadge && <span className="gear-menu__badge">novo</span>}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

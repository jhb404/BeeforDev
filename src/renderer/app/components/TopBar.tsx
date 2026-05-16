import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Bell, Moon, Newspaper, Sun } from '../../components/common/Icons';
import { TeamButton } from '../../features/team/components/TeamButton';
import type { AppSettings, SessionStatus, TodayAlert } from '@shared/types/index';
import { BellPanel } from './BellPanel';
import { UpdateBadge } from './UpdateBadge';
import { LunchTimerWidget } from './LunchTimerWidget';
import { BeeforLogo } from '../../components/common/BeeforLogo';
import { StatusBadge } from '../../components/common/StatusBadge';

const Coin2uBadge = lazy(() =>
  import('../../features/coin2u/components/Coin2uBadge').then((m) => ({ default: m.Coin2uBadge })),
);

type Tab = 'home' | 'settings';

const MONTH_NAMES_PT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

function currentMonthLabel(): string {
  const d = new Date();
  return `${MONTH_NAMES_PT[d.getMonth()]} ${d.getFullYear()}`;
}

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

  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-date">{currentMonthLabel()}</span>
        <div className="tabs">
          <button
            data-sound="tab-home"
            className={tab === 'home' ? 'active' : ''}
            onClick={() => onTabChange('home')}
          >
            Início
          </button>
          <button
            data-sound="tab-settings"
            className={tab === 'settings' ? 'active' : ''}
            onClick={() => onTabChange('settings')}
          >
            Configurações
          </button>
        </div>
      </div>
      <div className="topbar-actions">
        <UpdateBadge />
        <StatusBadge status={sessionStatus} />
        <LunchTimerWidget
          active={lunchTimerActive}
          startedAt={lunchStartedAt}
          onCancel={onCancelLunchTimer ?? (() => undefined)}
        />
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
        <TeamButton onOpen={onOpenTeam} partyCount={teamPartyBadge} />
        <span className="topbar-divider" aria-hidden="true" />
        <Suspense fallback={null}>
          <Coin2uBadge
            settings={appSettings}
            forceOpen={coin2uForceOpen}
            onForceOpenConsumed={onCoin2uForceOpenConsumed}
          />
        </Suspense>
        <span className="topbar-divider" aria-hidden="true" />
        <button
          data-sound="theme-toggle"
          className="icon-btn"
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            onToggleTheme({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
          }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          data-sound="journal"
          className={`icon-btn journal-btn ${journalBadge ? 'journal-btn--has-news' : ''}`}
          aria-label={journalBadge ? 'Jornal de patches — novidades!' : 'Jornal de patches'}
          title={journalBadge ? 'Tem novidades pra você ver!' : 'Jornal de patches'}
          onClick={onOpenPatchJournal}
        >
          <Newspaper size={18} />
          {journalBadge && <span className="journal-btn__dot" aria-hidden="true" />}
        </button>
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
      </div>
    </header>
  );
}

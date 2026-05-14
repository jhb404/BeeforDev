import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Bell, Moon, Newspaper, Sun } from '../../components/common/Icons';
import { TeamButton } from '../../features/team/components/TeamButton';
import type { AppSettings, TodayAlert } from '@shared/types';
import { BellPanel } from './BellPanel';
import { UpdateBadge } from './UpdateBadge';

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
  onToggleTheme: () => void;
  alerts: TodayAlert[];
  visibleAlerts: TodayAlert[];
  onAlertDismiss: (index: number) => void;
  onAlertSnooze: (index: number, minutes: number) => void;
  onOpenTeam: () => void;
  onOpenPatchJournal: () => void;
  teamPartyBadge: number;
  appSettings: AppSettings | null;
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
  teamPartyBadge,
  appSettings,
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
          <Coin2uBadge settings={appSettings} />
        </Suspense>
        <span className="topbar-divider" aria-hidden="true" />
        <button
          data-sound="theme-toggle"
          className="icon-btn"
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          data-sound="journal"
          className="icon-btn"
          aria-label="Jornal de patches"
          title="Jornal de patches"
          onClick={onOpenPatchJournal}
        >
          <Newspaper size={18} />
        </button>
      </div>
    </header>
  );
}

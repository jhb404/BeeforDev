import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { settingsClient, IpcProvider } from './services/ipc';
import { systemClient } from './services/ipc';
import { TitleBar } from './components/layout/TitleBar';
import { StartupOverlay } from './components/layout/StartupOverlay';
import { SettingsProvider, useSettings } from './app/providers/SettingsProvider';
import { ThemeProvider, useTheme } from './app/providers/ThemeProvider';
import { useAlerts } from './app/hooks/useAlerts';
import { useUiSoundsDelegate } from './app/hooks/useUiSoundsDelegate';
import { useAlarmRouter } from './app/hooks/useAlarmRouter';
import { useBirthdayWatcher } from './app/hooks/useBirthdayWatcher';
import { useTeamPhotoPreload } from './app/hooks/useTeamPhotoPreload';
import { TopBar } from './app/components/TopBar';
import { PatchJournalModal } from './app/components/PatchJournalModal';
import { ToastProvider, useToast } from './app/providers/ToastProvider';
import { ToastHost } from './app/components/ToastHost';
import { ErrorBoundary } from './app/components/ErrorBoundary';
import { UpdateOverlay } from './app/components/UpdateOverlay';
import { ProfileModal } from './app/components/ProfileModal';
import { useUpdater } from './hooks/useUpdater';
import { useTeamPrefetch } from './app/hooks/useTeamPrefetch';
import { useAppIconSync } from './hooks/useAppIconSync';
import { useJournalBadge } from './hooks/useJournalBadge';
import { useGamification } from './features/gamification';
import { playAlarmByKind } from './utils/alarm';
import { useBeefor } from './hooks/useBeefor';

type Tab = 'home' | 'settings';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const SettingsPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const TeamModal = lazy(() =>
  import('./features/team/components/TeamModal').then((m) => ({ default: m.TeamModal })),
);

function AppShell() {
  const { settings: appSettings } = useSettings();
  const { theme, toggle: toggleTheme } = useTheme();
  const showToast = useToast();

  const [tab, setTab] = useState<Tab>('home');
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [homeBootReady, setHomeBootReady] = useState(false);
  const [startupComplete, setStartupComplete] = useState(false);
  const [patchModalOpen, setPatchModalOpen] = useState(false);
  const [patchJournal, setPatchJournal] = useState('');
  const [loadingPatchJournal, setLoadingPatchJournal] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [coin2uForceOpen, setCoin2uForceOpen] = useState(false);
  const [lunchTimerActive, setLunchTimerActive] = useState(false);
  const [lunchStartedAt, setLunchStartedAt] = useState<number | null>(null);
  const lunchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const alerts = useAlerts();
  const birthday = useBirthdayWatcher(startupComplete, !!appSettings?.uiSounds, teamModalOpen);

  useUiSoundsDelegate(!!appSettings?.uiSounds);
  useAlarmRouter();
  useTeamPhotoPreload(startupComplete);
  useTeamPrefetch(startupComplete, homeBootReady);

  // Sync Windows taskbar/titlebar icon with active gamification variant.
  const { stats } = useGamification();
  const activeIconId =
    stats.unlockedIconVariantIds[stats.unlockedIconVariantIds.length - 1] ?? 'orange';
  useAppIconSync(activeIconId);

  const { state: updateState } = useUpdater();

  const handleStartupComplete = useCallback(() => setStartupComplete(true), []);

  const startLunchTimer = () => {
    if (lunchTimerRef.current) clearTimeout(lunchTimerRef.current);
    const now = Date.now();
    setLunchTimerActive(true);
    setLunchStartedAt(now);
    systemClient.setLunchTimerActive(true);
    void playAlarmByKind('lunch');
    void systemClient.notifyWindows('🍽️ Alerta Almoço', 'Timer de 1h iniciado. Bom apetite!');
    showToast({ kind: 'ok', msg: 'Timer de almoço iniciado — 1 hora.' });
    lunchTimerRef.current = setTimeout(
      () => {
        setLunchTimerActive(false);
        setLunchStartedAt(null);
        systemClient.setLunchTimerActive(false);
        showToast({ kind: 'ok', title: 'Almoço encerrado!', msg: 'Já passou 1 hora de almoço.' });
        lunchTimerRef.current = null;
      },
      60 * 60 * 1000,
    );
  };

  const cancelLunchTimer = () => {
    if (lunchTimerRef.current) clearTimeout(lunchTimerRef.current);
    lunchTimerRef.current = null;
    setLunchTimerActive(false);
    setLunchStartedAt(null);
    systemClient.setLunchTimerActive(false);
    showToast({ kind: 'ok', msg: 'Timer de almoço cancelado.' });
  };

  useEffect(() => {
    const offLunch = systemClient.onTrayLunchTimer(startLunchTimer);
    const offKudo = systemClient.onTrayOpenKudo(() => {
      setTab('home');
      window.dispatchEvent(new CustomEvent('beefor:open-kudo'));
    });
    const offCoins = systemClient.onTrayOpenCoins(() => {
      setCoin2uForceOpen(true);
    });
    return () => {
      offLunch();
      offKudo();
      offCoins();
      if (lunchTimerRef.current) clearTimeout(lunchTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { status: sessionStatus } = useBeefor();
  const { showBadge: journalBadge, markAsSeen: markJournalSeen } = useJournalBadge();

  const openPatchJournal = async () => {
    setPatchModalOpen(true);
    setLoadingPatchJournal(true);
    markJournalSeen();
    const res = await settingsClient.get();
    setPatchJournal(res.patchJournal?.trim() || 'Nenhuma atualizacao publicada ainda.');
    setLoadingPatchJournal(false);
  };

  const logoVariant = appSettings?.logoVariant ?? 'orange';

  return (
    <div className="app-shell">
      <TitleBar logoVariant={logoVariant} />
      <TopBar
        tab={tab}
        onTabChange={setTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        sessionStatus={sessionStatus}
        alerts={alerts.alerts}
        visibleAlerts={alerts.visibleAlerts}
        onAlertDismiss={alerts.dismiss}
        onAlertSnooze={alerts.snooze}
        onOpenTeam={() => {
          setTeamModalOpen(true);
          birthday.dismissBadge();
        }}
        onOpenPatchJournal={() => void openPatchJournal()}
        journalBadge={journalBadge}
        onOpenProfile={() => setProfileModalOpen(true)}
        teamPartyBadge={birthday.partyBadge}
        appSettings={appSettings}
        coin2uForceOpen={coin2uForceOpen}
        onCoin2uForceOpenConsumed={() => setCoin2uForceOpen(false)}
        lunchTimerActive={lunchTimerActive}
        lunchStartedAt={lunchStartedAt}
        onCancelLunchTimer={cancelLunchTimer}
      />

      <main className="content">
        <section className="tab-panel" hidden={tab !== 'home'}>
          <ErrorBoundary label="home">
            <Suspense fallback={<div className="route-loader">Carregando...</div>}>
              <Home
                onMoodChanged={(mood) => alerts.setCurrentMoodExternal(mood)}
                onBootReady={() => setHomeBootReady(true)}
                onStartLunchTimer={() => {
                  if (!lunchTimerActive) startLunchTimer();
                }}
              />
            </Suspense>
          </ErrorBoundary>
        </section>
        <section className="tab-panel" hidden={tab !== 'settings'}>
          {tab === 'settings' && (
            <ErrorBoundary label="settings">
              <Suspense fallback={<div className="route-loader">Carregando...</div>}>
                <SettingsPage
                  onSettingsChanged={() =>
                    window.dispatchEvent(new Event('beefor:settings-changed'))
                  }
                />
              </Suspense>
            </ErrorBoundary>
          )}
        </section>
      </main>

      <ErrorBoundary label="team-modal">
        <Suspense fallback={null}>
          {teamModalOpen && (
            <TeamModal open={teamModalOpen} onClose={() => setTeamModalOpen(false)} />
          )}
        </Suspense>
      </ErrorBoundary>

      <PatchJournalModal
        open={patchModalOpen}
        loading={loadingPatchJournal}
        text={patchJournal}
        onClose={() => setPatchModalOpen(false)}
      />

      <ProfileModal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} />

      <ToastHost />
      <UpdateOverlay
        visible={updateState.status === 'installing'}
        version={updateState.status === 'installing' ? updateState.version : undefined}
      />
      <footer className="appfoot">Beefor U - JB</footer>
      <StartupOverlay
        logoVariant={logoVariant}
        ready={!!appSettings && homeBootReady}
        onComplete={handleStartupComplete}
      />
    </div>
  );
}

export default function App() {
  return (
    <IpcProvider>
      <SettingsProvider>
        <ThemeProvider>
          <ToastProvider>
            <AppShell />
          </ToastProvider>
        </ThemeProvider>
      </SettingsProvider>
    </IpcProvider>
  );
}

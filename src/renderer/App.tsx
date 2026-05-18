import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { IpcProvider } from './services/ipc';
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
import { OnboardingModal } from './app/components/OnboardingModal';
import { ToastProvider, useToast } from './app/providers/ToastProvider';
import { ToastHost } from './app/components/ToastHost';
import { ErrorBoundary } from './app/components/ErrorBoundary';
import { UpdateOverlay } from './app/components/UpdateOverlay';
import { ProfileModal } from './app/components/ProfileModal';
import { useUpdater } from './hooks/useUpdater';
import { useTeamPrefetch } from './app/hooks/useTeamPrefetch';
import { useAppIconSync } from './hooks/useAppIconSync';
import { useGamification } from './features/gamification';
import { useBeefor } from './hooks/useBeefor';
import { APP_EVENTS, emitAppEvent } from './app/events';
import { useLunchTimer } from './app/hooks/useLunchTimer';
import { usePatchJournal } from './app/hooks/usePatchJournal';
import { useTrayListeners } from './app/hooks/useTrayListeners';

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
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [coin2uForceOpen, setCoin2uForceOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const { lunchTimerActive, lunchStartedAt, startLunchTimer, cancelLunchTimer } =
    useLunchTimer(showToast);
  const {
    journalBadge,
    patchModalOpen,
    patchJournal,
    loadingPatchJournal,
    openPatchJournal,
    closePatchJournal,
  } = usePatchJournal();

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

  const { state: updateState, install: installUpdate } = useUpdater();

  useEffect(() => {
    if (updateState.status !== 'ready') return;
    showToast(
      {
        kind: 'ok',
        title: `Atualização v${updateState.version} pronta`,
        msg: 'Clique em instalar para reiniciar e atualizar.',
        persistent: true,
        action: { label: 'Instalar agora', onClick: installUpdate },
      },
      0,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateState.status]);

  const handleStartupComplete = useCallback(() => setStartupComplete(true), []);

  useEffect(() => {
    if (startupComplete && appSettings && !onboardingChecked) {
      setOnboardingChecked(true);
      if (!appSettings.onboarded) setOnboardingOpen(true);
    }
  }, [startupComplete, appSettings, onboardingChecked]);

  const openKudoFromTray = useCallback(() => {
    setTab('home');
    emitAppEvent(APP_EVENTS.OPEN_KUDO);
  }, []);

  const openCoinsFromTray = useCallback(() => {
    setCoin2uForceOpen(true);
  }, []);

  useTrayListeners({
    onLunchTimer: startLunchTimer,
    onOpenKudo: openKudoFromTray,
    onOpenCoins: openCoinsFromTray,
  });

  const { status: sessionStatus } = useBeefor();

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
                <SettingsPage onSettingsChanged={() => emitAppEvent(APP_EVENTS.SETTINGS_CHANGED)} />
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
        onClose={closePatchJournal}
      />

      <OnboardingModal open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />

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

import { Suspense, lazy, useCallback, useState } from 'react';
import { settingsClient } from './services/ipc';
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
import { ToastProvider } from './app/providers/ToastProvider';
import { ToastHost } from './app/components/ToastHost';

type Tab = 'home' | 'settings';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const SettingsPage = lazy(() =>
  import('./pages/Settings').then((m) => ({ default: m.Settings })),
);
const TeamModal = lazy(() =>
  import('./components/team/TeamModal').then((m) => ({ default: m.TeamModal })),
);

function AppShell() {
  const { settings: appSettings } = useSettings();
  const { theme, toggle: toggleTheme } = useTheme();

  const [tab, setTab] = useState<Tab>('home');
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [homeBootReady, setHomeBootReady] = useState(false);
  const [startupComplete, setStartupComplete] = useState(false);
  const [patchModalOpen, setPatchModalOpen] = useState(false);
  const [patchJournal, setPatchJournal] = useState('');
  const [loadingPatchJournal, setLoadingPatchJournal] = useState(false);

  const alerts = useAlerts();
  const birthday = useBirthdayWatcher(
    startupComplete,
    !!appSettings?.uiSounds,
    teamModalOpen,
  );

  useUiSoundsDelegate(!!appSettings?.uiSounds);
  useAlarmRouter();
  useTeamPhotoPreload(startupComplete);

  const handleStartupComplete = useCallback(() => setStartupComplete(true), []);

  const openPatchJournal = async () => {
    setPatchModalOpen(true);
    setLoadingPatchJournal(true);
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
        alerts={alerts.alerts}
        visibleAlerts={alerts.visibleAlerts}
        onAlertDismiss={alerts.dismiss}
        onAlertSnooze={alerts.snooze}
        onOpenTeam={() => {
          setTeamModalOpen(true);
          birthday.dismissBadge();
        }}
        onOpenPatchJournal={() => void openPatchJournal()}
        teamPartyBadge={birthday.partyBadge}
        appSettings={appSettings}
      />

      <main className="content">
        <section className="tab-panel" hidden={tab !== 'home'}>
          <Suspense fallback={<div className="route-loader">Carregando...</div>}>
            <Home
              onMoodChanged={(mood) => alerts.setCurrentMoodExternal(mood)}
              onBootReady={() => setHomeBootReady(true)}
            />
          </Suspense>
        </section>
        <section className="tab-panel" hidden={tab !== 'settings'}>
          {tab === 'settings' && (
            <Suspense fallback={<div className="route-loader">Carregando...</div>}>
              <SettingsPage
                onSettingsChanged={() =>
                  window.dispatchEvent(new Event('beefor:settings-changed'))
                }
              />
            </Suspense>
          )}
        </section>
      </main>

      <Suspense fallback={null}>
        {teamModalOpen && (
          <TeamModal open={teamModalOpen} onClose={() => setTeamModalOpen(false)} />
        )}
      </Suspense>

      <PatchJournalModal
        open={patchModalOpen}
        loading={loadingPatchJournal}
        text={patchJournal}
        onClose={() => setPatchModalOpen(false)}
      />

      <ToastHost />
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
    <SettingsProvider>
      <ThemeProvider>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}

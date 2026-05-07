import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Moon, Newspaper, Sun } from './components/Icons';
import { TitleBar } from './components/TitleBar';
import { PatchJournal } from './components/PatchJournal';
import { TeamButton } from './components/team/TeamButton';
import { loadBirthdayCache, loadMembersCache, birthdayKey } from './utils/teamCache';
import { isBirthdayToday } from './utils/dateUtils';
import { playAlarmByKind, playUiBirthdayAlert, playUiClick, playUiSound, type UiSoundKind } from './utils/alarm';
import { StartupOverlay } from './components/StartupOverlay';
import type { AppSettings, TodayAlert } from '../shared/types';

type Tab = 'home' | 'settings';
type ThemeMode = 'dark' | 'light';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const SettingsPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const TeamModal = lazy(() => import('./components/team/TeamModal').then((m) => ({ default: m.TeamModal })));
const Coin2uBadge = lazy(() => import('./components/Coin2uBadge').then((m) => ({ default: m.Coin2uBadge })));

function preloadTeamPhotos(limit = 4) {
  const cache = loadMembersCache();
  if (!cache) return;
  const urls = Array.from(
    new Set(
      cache.members
        .map((m) => m.foto)
        .filter((src): src is string => !!src && /^https?:\/\//i.test(src)),
    ),
  );
  if (urls.length === 0) return;

  let cursor = 0;
  const loadNext = () => {
    const src = urls[cursor];
    cursor += 1;
    if (!src) return;
    const img = new Image();
    img.onload = loadNext;
    img.onerror = loadNext;
    img.referrerPolicy = 'no-referrer';
    img.src = src;
  };
  for (let i = 0; i < Math.min(limit, urls.length); i += 1) loadNext();
}

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem('beefor-theme');
  return saved === 'light' ? 'light' : 'dark';
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + mins;
  const clamped = Math.min(total, 23 * 60 + 59);
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
}

function applyDensity(density: AppSettings['uiDensity']) {
  document.documentElement.dataset.density = density ?? 'normal';
}

function applyThemeOverrides(overrides: AppSettings['themeOverrides']) {
  const el = document.documentElement;
  if (!overrides) return;
  if (overrides.accent) el.style.setProperty('--accent', overrides.accent);
  if (overrides.accentHover) el.style.setProperty('--accent-hover', overrides.accentHover);
  if (overrides.warm) el.style.setProperty('--warm', overrides.warm);
  if (overrides.ok) el.style.setProperty('--ok', overrides.ok);
  if (overrides.err) el.style.setProperty('--err', overrides.err);
  if (overrides.radius) el.style.setProperty('--radius', overrides.radius);
  if (overrides.fontScale) el.style.setProperty('font-size', `${Number(overrides.fontScale) * 14}px`);
}

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const [alerts, setAlerts] = useState<TodayAlert[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [patchModalOpen, setPatchModalOpen] = useState(false);
  const [patchJournal, setPatchJournal] = useState('');
  const [loadingPatchJournal, setLoadingPatchJournal] = useState(false);
  const [currentMoodExternal, setCurrentMoodExternal] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamPartyCount, setTeamPartyCount] = useState(0);
  const [teamPartyBadge, setTeamPartyBadge] = useState(0);
  const [pendingBirthdayCount, setPendingBirthdayCount] = useState(0);
  const [homeBootReady, setHomeBootReady] = useState(false);
  const [startupComplete, setStartupComplete] = useState(false);
  const birthdayAlertsInjected = useRef(false);
  const birthdaySoundPlayed = useRef(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('beefor-theme', theme);
  }, [theme]);

  // Load settings → apply density + theme overrides
  useEffect(() => {
    void window.beefor.getSettings().then((s) => {
      setAppSettings(s);
      applyDensity(s.uiDensity);
      applyThemeOverrides(s.themeOverrides);
    });
  }, []);

  // Re-apply when settings change (emitted from Settings page via storage event)
  useEffect(() => {
    const handler = () => {
      void window.beefor.getSettings().then((s) => {
        setAppSettings(s);
        applyDensity(s.uiDensity);
        applyThemeOverrides(s.themeOverrides);
      });
    };
    window.addEventListener('beefor:settings-changed', handler);
    return () => window.removeEventListener('beefor:settings-changed', handler);
  }, []);

  // UI sounds (global delegate)
  useEffect(() => {
    if (!appSettings?.uiSounds) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest('button, [role="button"], [data-sound]') as HTMLElement | null;
      if (!btn) return;
      if ((btn as HTMLButtonElement).disabled) return;
      // Mute generic click inside kudo history list (lots of items → annoying)
      if (target.closest('.kudo-history-list') && !btn.dataset.sound) return;
      const kind = btn.dataset.sound as UiSoundKind | undefined;
      if (kind) playUiSound(kind);
      else void playUiClick();
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [appSettings?.uiSounds]);

  // Sons por tipo
  useEffect(() => {
    const off = window.beefor.onPlayAlarm((info) => {
      const kind = info.title.includes('Mood') ? 'mood'
        : info.title.includes('almoço') || info.title.includes('Almoço') ? 'lunch'
        : info.title.includes('Ponto') ? 'punch'
        : info.title.includes('Kudocard') || info.title.includes('kudocard') ? 'kudocard'
        : 'default';
      void playAlarmByKind(kind);
    });
    return off;
  }, []);

  useEffect(() => {
    void window.beefor.getTodayAlerts().then((res) => {
      if (res.ok && res.data) setAlerts(res.data);
    });
    void window.beefor.getCurrentMood().then((res) => {
      if (res.ok) setCurrentMoodExternal(res.data ?? null);
    });
  }, []);

  useEffect(() => {
    const off = window.beefor.onNotify((info) => {
      if (info.title === 'sync:autoLancamento' && info.body === 'ok') return;
    });
    return off;
  }, []);

  useEffect(() => {
    const recompute = () => {
      const cache = loadMembersCache();
      const bdays = loadBirthdayCache();
      if (!cache) {
        setTeamPartyCount(0);
        setPendingBirthdayCount(0);
        return;
      }
      const todayBirthdays: typeof cache.members = [];
      for (const m of cache.members) {
        const b = bdays[birthdayKey(m)]?.birthday;
        if (isBirthdayToday(b)) todayBirthdays.push(m);
      }
      if (todayBirthdays.length > 0 && !birthdayAlertsInjected.current) {
        birthdayAlertsInjected.current = true;
        setPendingBirthdayCount(todayBirthdays.length);
      }
    };
    recompute();
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === 'beefor-team-members' || e.key === 'beefor-team-birthdays') recompute();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [teamModalOpen]);

  // Birthday visual + sound must appear together after startup is fully done.
  useEffect(() => {
    if (birthdaySoundPlayed.current) return;
    if (!startupComplete || pendingBirthdayCount <= 0) return;
    const timer = window.setTimeout(() => {
      setTeamPartyCount(pendingBirthdayCount);
      setTeamPartyBadge(pendingBirthdayCount);
      birthdaySoundPlayed.current = true;
      if (appSettings?.uiSounds) void playUiBirthdayAlert();
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [pendingBirthdayCount, appSettings?.uiSounds, startupComplete]);

  useEffect(() => {
    if (!startupComplete) return;
    const timer = window.setTimeout(() => preloadTeamPhotos(4), 1200);
    return () => window.clearTimeout(timer);
  }, [startupComplete]);

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

  const toggleTheme = () => {
    // Add transition class before flipping data-theme so all elements interpolate
    // their color/background/border tokens together rather than snapping piecewise.
    const root = document.documentElement;
    root.classList.add('theme-anim');
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    window.setTimeout(() => root.classList.remove('theme-anim'), 360);
  };

  const openPatchJournal = async () => {
    setPatchModalOpen(true);
    setLoadingPatchJournal(true);
    const res = await window.beefor.getSettings();
    setPatchJournal(res.patchJournal?.trim() || 'Nenhuma atualizacao publicada ainda.');
    setLoadingPatchJournal(false);
  };

  const dismissAlert = (i: number) => {
    setAlerts((prev) => prev.filter((_, j) => j !== i));
  };

  const snoozeAlert = (i: number, mins: number) => {
    const until = addMinutes(nowHHMM(), mins);
    setAlerts((prev) =>
      prev.map((a, j) => (j === i ? { ...a, snoozedUntil: until } : a)),
    );
  };

  const now = nowHHMM();
  const visibleAlerts = alerts.filter((a) => {
    if (a.kind === 'mood' && currentMoodExternal) return false;
    if (a.snoozedUntil && a.snoozedUntil > now) return false;
    return true;
  });

  const logoVariant = appSettings?.logoVariant ?? 'orange';
  const handleStartupComplete = useCallback(() => setStartupComplete(true), []);

  // Topbar left: current month + session quick info
  const today = new Date();
  const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const topbarLeft = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <div className="app-shell">
      <TitleBar logoVariant={logoVariant} />
      <header className="topbar">
        <div className="topbar-left">
          <span className="topbar-date">{topbarLeft}</span>
          <div className="tabs">
            <button data-sound="tab-home" className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>
              Início
            </button>
            <button data-sound="tab-settings" className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
              Configurações
            </button>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="bell-wrap" ref={bellRef}>
            <button
              className="icon-btn"
              aria-label="Avisos de hoje"
              onClick={() => setBellOpen((o) => !o)}
            >
              <Bell size={18} />
              {visibleAlerts.length > 0 && (
                <span className="bell-badge">{visibleAlerts.length}</span>
              )}
            </button>
            {bellOpen && (
              <div className="bell-panel" role="dialog" aria-label="Avisos de hoje">
                <div className="bell-panel__header">Avisos de hoje</div>
                {visibleAlerts.length === 0 ? (
                  <p className="bell-panel__empty">Nenhum aviso pendente.</p>
                ) : (
                  <ul className="bell-panel__list">
                    {visibleAlerts.map((a, i) => {
                      const realIdx = alerts.indexOf(a);
                      return (
                        <li key={i} className={`bell-item bell-item--${a.kind}`}>
                          <div className="bell-item__main">
                            <span className="bell-item__title">{a.title}</span>
                            <span className="bell-item__meta">
                              {a.time && (
                                <span className="bell-item__time">{a.time}</span>
                              )}
                              <span className="bell-item__body">{a.body}</span>
                            </span>
                          </div>
                          <div className="bell-item__actions">
                            {a.kind !== 'birthday' && (
                              <>
                                <button
                                  className="bell-action bell-action--snooze"
                                  title="Adiar 5 min"
                                  onClick={() => snoozeAlert(realIdx, 5)}
                                >
                                  +5m
                                </button>
                                <button
                                  className="bell-action bell-action--snooze"
                                  title="Adiar 10 min"
                                  onClick={() => snoozeAlert(realIdx, 10)}
                                >
                                  +10m
                                </button>
                                <button
                                  className="bell-action bell-action--snooze"
                                  title="Adiar 15 min"
                                  onClick={() => snoozeAlert(realIdx, 15)}
                                >
                                  +15m
                                </button>
                              </>
                            )}
                            {a.kind === 'birthday' && (
                              <button
                                className="bell-action bell-action--primary"
                                onClick={() => {
                                  setTeamModalOpen(true);
                                  setBellOpen(false);
                                }}
                              >
                                Ver time
                              </button>
                            )}
                            {a.kind === 'mood' && (
                              <button
                                className="bell-action bell-action--primary"
                                onClick={() => {
                                  setTab('home');
                                  setBellOpen(false);
                                }}
                              >
                                Marcar agora
                              </button>
                            )}
                            <button
                              className="bell-action bell-action--dismiss"
                              aria-label="Dispensar"
                              onClick={() => dismissAlert(realIdx)}
                            >
                              ✕
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
          <TeamButton
            onOpen={() => {
              setTeamModalOpen(true);
              setTeamPartyBadge(0);
            }}
            partyCount={teamPartyBadge}
          />
          <span className="topbar-divider" aria-hidden="true" />
          <Suspense fallback={null}>
            <Coin2uBadge settings={appSettings} />
          </Suspense>
          <span className="topbar-divider" aria-hidden="true" />
          <button
            data-sound="theme-toggle"
            className="icon-btn"
            aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            data-sound="journal"
            className="icon-btn"
            aria-label="Jornal de patches"
            title="Jornal de patches"
            onClick={() => void openPatchJournal()}
          >
            <Newspaper size={18} />
          </button>
        </div>
      </header>

      <main className="content">
        <section className="tab-panel" hidden={tab !== 'home'}>
          <Suspense fallback={<div className="route-loader">Carregando...</div>}>
            <Home
              onMoodChanged={(mood) => setCurrentMoodExternal(mood)}
              onBootReady={() => setHomeBootReady(true)}
            />
          </Suspense>
        </section>
        <section className="tab-panel" hidden={tab !== 'settings'}>
          {tab === 'settings' && (
            <Suspense fallback={<div className="route-loader">Carregando...</div>}>
              <SettingsPage onSettingsChanged={() => window.dispatchEvent(new Event('beefor:settings-changed'))} />
            </Suspense>
          )}
        </section>
      </main>

      <Suspense fallback={null}>
        {teamModalOpen && <TeamModal open={teamModalOpen} onClose={() => setTeamModalOpen(false)} />}
      </Suspense>

      {patchModalOpen &&
        createPortal(
          <div className="modal-backdrop" role="presentation">
            <section aria-modal="true" className="modal-card" role="dialog" aria-label="Jornal de patches">
              <div className="modal-head">
                <div>
                  <p className="eyebrow">Novidades</p>
                  <h2>Jornal de patches e atualizacoes</h2>
                </div>
                <button data-sound="close" className="secondary compact" onClick={() => setPatchModalOpen(false)}>
                  Fechar
                </button>
              </div>
              <div className="patch-journal-modal-body">
                {loadingPatchJournal ? (
                  <p className="patch-journal-empty">Carregando novidades...</p>
                ) : (
                  <PatchJournal text={patchJournal} />
                )}
              </div>
            </section>
          </div>,
          document.body,
        )}

      <footer className="appfoot">Beefor U - JB</footer>
      <StartupOverlay
        logoVariant={logoVariant}
        ready={!!appSettings && homeBootReady}
        onComplete={handleStartupComplete}
      />
    </div>
  );
}

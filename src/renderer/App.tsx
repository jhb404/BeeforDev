import { useEffect, useRef, useState } from 'react';
import { Home } from './pages/Home';
import { Settings as SettingsPage } from './pages/Settings';
import { Bell, Moon, Newspaper, Sun } from './components/Icons';
import { TitleBar } from './components/TitleBar';
import { playAlarmByKind } from './utils/alarm';
import type { TodayAlert } from '../shared/types';

type Tab = 'home' | 'settings';
type ThemeMode = 'dark' | 'light';

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

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const [alerts, setAlerts] = useState<TodayAlert[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [patchModalOpen, setPatchModalOpen] = useState(false);
  const [patchJournal, setPatchJournal] = useState('');
  const [loadingPatchJournal, setLoadingPatchJournal] = useState(false);
  const [currentMoodExternal, setCurrentMoodExternal] = useState<string | null>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('beefor-theme', theme);
  }, [theme]);

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

  // Carregar alertas e mood atual para filtrar
  useEffect(() => {
    void window.beefor.getTodayAlerts().then((res) => {
      if (res.ok && res.data) setAlerts(res.data);
    });
    // Buscar mood atual para filtrar alerta de mood se já marcado
    void window.beefor.getCurrentMood().then((res) => {
      if (res.ok) setCurrentMoodExternal(res.data ?? null);
    });
  }, []);

  // Atualizar mood externo quando mudanças acontecem
  useEffect(() => {
    const off = window.beefor.onNotify((info) => {
      if (info.title === 'sync:autoLancamento' && info.body === 'ok') return;
      // Quando mood é salvo com sucesso, re-buscar
    });
    return off;
  }, []);

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

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

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

  // Alertas visíveis: excluir mood se já marcado, excluir snoozed que ainda não passou
  const now = nowHHMM();
  const visibleAlerts = alerts.filter((a) => {
    if (a.kind === 'mood' && currentMoodExternal) return false;
    if (a.snoozedUntil && a.snoozedUntil > now) return false;
    return true;
  });

  return (
    <div className="app-shell">
      <TitleBar />
      <header className="topbar">
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
          <button
            className="icon-btn"
            aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="icon-btn"
            aria-label="Jornal de patches"
            title="Jornal de patches"
            onClick={() => void openPatchJournal()}
          >
            <Newspaper size={18} />
          </button>
          <div className="tabs">
            <button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>
              Inicio
            </button>
            <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
              Configurações
            </button>
          </div>
        </div>
      </header>

      <main className="content">
        <section className="tab-panel" hidden={tab !== 'home'}>
          <Home onMoodChanged={(mood) => setCurrentMoodExternal(mood)} />
        </section>
        <section className="tab-panel" hidden={tab !== 'settings'}>
          <SettingsPage />
        </section>
      </main>

      {patchModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <section aria-modal="true" className="modal-card" role="dialog" aria-label="Jornal de patches">
            <div className="modal-head">
              <div>
                <p className="eyebrow">Novidades</p>
                <h2>Jornal de patches e atualizacoes</h2>
              </div>
              <button className="secondary compact" onClick={() => setPatchModalOpen(false)}>
                Fechar
              </button>
            </div>
            <div style={{ padding: '14px 18px 18px' }}>
              {loadingPatchJournal ? (
                <p className="patch-journal-empty">Carregando novidades...</p>
              ) : (
                <pre className="patch-journal-copy">{patchJournal}</pre>
              )}
            </div>
          </section>
        </div>
      )}

      <footer className="appfoot">Beefor Dev - JB</footer>
    </div>
  );
}

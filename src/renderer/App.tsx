import { useEffect, useRef, useState } from 'react';
import { Home } from './pages/Home';
import { Settings as SettingsPage } from './pages/Settings';
import { Bell, BrandLogo, Moon, Newspaper, Sun } from './components/Icons';
import { playAlarm } from './utils/alarm';
import type { TodayAlert } from '../shared/types';

type Tab = 'home' | 'settings';
type ThemeMode = 'dark' | 'light';

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem('beefor-theme');
  return saved === 'light' ? 'light' : 'dark';
}

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const [alerts, setAlerts] = useState<TodayAlert[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [patchModalOpen, setPatchModalOpen] = useState(false);
  const [patchJournal, setPatchJournal] = useState('');
  const [loadingPatchJournal, setLoadingPatchJournal] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('beefor-theme', theme);
  }, [theme]);

  useEffect(() => {
    const off = window.beefor.onPlayAlarm(() => {
      void playAlarm();
    });
    return off;
  }, []);

  useEffect(() => {
    void window.beefor.getTodayAlerts().then((res) => {
      if (res.ok && res.data) setAlerts(res.data);
    });
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

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            <BrandLogo size={28} />
          </span>
          <span className="brand-name">Beefor Dev</span>
        </div>
        <div className="topbar-actions">
          <div className="bell-wrap" ref={bellRef}>
            <button
              className="icon-btn"
              aria-label="Avisos de hoje"
              onClick={() => setBellOpen((o) => !o)}
            >
              <Bell size={18} />
              {alerts.length > 0 && <span className="bell-badge">{alerts.length}</span>}
            </button>
            {bellOpen && (
              <div className="bell-panel" role="dialog" aria-label="Avisos de hoje">
                <div className="bell-panel__header">Hoje</div>
                {alerts.length === 0 ? (
                  <p className="bell-panel__empty">Nenhum aviso para hoje.</p>
                ) : (
                  <ul className="bell-panel__list">
                    {alerts.map((a, i) => (
                      <li key={i} className={`bell-item bell-item--${a.kind}`}>
                        <span className="bell-item__title">{a.title}</span>
                        <span className="bell-item__meta">
                          {a.time && <span className="bell-item__time">{a.time}</span>}
                          <span className="bell-item__body">{a.body}</span>
                        </span>
                        <button
                          className="bell-item__dismiss"
                          aria-label="Dispensar"
                          onClick={() => setAlerts((prev) => prev.filter((_, j) => j !== i))}
                        >
                          x
                        </button>
                      </li>
                    ))}
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
          <Home />
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

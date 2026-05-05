import { useEffect, useState } from 'react';
import { Home } from './pages/Home';
import { Settings as SettingsPage } from './pages/Settings';
import { BrandLogo, Moon, Sun } from './components/Icons';
import { playAlarm } from './utils/alarm';

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

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            <BrandLogo size={28} />
          </span>
          <span className="brand-name">beefor dev</span>
        </div>
        <div className="topbar-actions">
          <button
            className="icon-btn"
            aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="tabs">
            <button
              className={tab === 'home' ? 'active' : ''}
              onClick={() => setTab('home')}
            >
              Início
            </button>
            <button
              className={tab === 'settings' ? 'active' : ''}
              onClick={() => setTab('settings')}
            >
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

      <footer className="appfoot">
        beefor dev · uso interno · Playwright + Electron
      </footer>
    </div>
  );
}

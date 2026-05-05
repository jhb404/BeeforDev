import { useEffect, useState } from 'react';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';

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

  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-logo" aria-hidden="true">
            <span className="brand-logo__wing brand-logo__wing--left" />
            <span className="brand-logo__body">
              <span />
              <span />
              <span />
            </span>
            <span className="brand-logo__wing brand-logo__wing--right" />
          </span>
          beefor dev
        </div>
        <div className="topbar-actions">
          <button
            aria-label={`Ativar modo ${nextTheme === 'dark' ? 'escuro' : 'claro'}`}
            aria-pressed={theme === 'dark'}
            className={`theme-switch ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
            onClick={() => setTheme(nextTheme)}
            type="button"
          >
            <span className="theme-switch__icon">☀</span>
            <span className="theme-switch__track">
              <span className="theme-switch__thumb" />
            </span>
            <span className="theme-switch__icon">☾</span>
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
          <Settings />
        </section>
      </main>

      <footer
        style={{
          padding: '8px 22px',
          borderTop: '1px solid var(--border)',
          color: 'var(--text-muted)',
          fontSize: 12,
          textAlign: 'right',
          background: 'var(--bg-1)',
        }}
      >
        beefor Dev · uso interno · Playwright + Electron
      </footer>
    </div>
  );
}

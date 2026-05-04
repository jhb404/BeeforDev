import { useState } from 'react';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';

type Tab = 'home' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('home');

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="dot" />
          beefor Dev
        </div>
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
      </header>

      <main className="content">
        {tab === 'home' ? <Home /> : <Settings />}
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

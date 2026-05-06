import { BrandLogo } from './Icons';

export function TitleBar() {
  return (
    <div className="titlebar">
      <div className="titlebar-drag">
        <span className="titlebar-icon" aria-hidden="true">
          <BrandLogo size={16} />
        </span>
        <span className="titlebar-label">Beefor Dev</span>
      </div>
      <div className="titlebar-controls">
        <button
          className="titlebar-btn titlebar-btn--min"
          aria-label="Minimizar"
          onClick={() => window.beefor.winMinimize()}
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          className="titlebar-btn titlebar-btn--max"
          aria-label="Maximizar"
          onClick={() => window.beefor.winMaximize()}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        </button>
        <button
          className="titlebar-btn titlebar-btn--close"
          aria-label="Fechar"
          onClick={() => window.beefor.winClose()}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" />
            <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

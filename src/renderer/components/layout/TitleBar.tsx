import { useAppLogo } from '../../hooks/useAppLogo';
import { BrandLogo } from '../common/Icons';
import { windowClient } from '../../services/ipc';

interface Props {
  logoVariant?: 'orange' | 'purple';
}

export function TitleBar({ logoVariant = 'orange' }: Props) {
  const logoSrc = useAppLogo(logoVariant, 'icon');

  return (
    <div className="titlebar">
      <div className="titlebar-drag">
        <span className="titlebar-icon" aria-hidden="true">
          {logoSrc ? (
            <img src={logoSrc} width={18} height={18} alt="" style={{ objectFit: 'contain' }} />
          ) : (
            <BrandLogo size={16} />
          )}
        </span>
        <span className="titlebar-label">Beefor U</span>
      </div>
      <div className="titlebar-controls">
        <button
          className="titlebar-btn titlebar-btn--min"
          aria-label="Minimizar"
          onClick={() => windowClient.minimize()}
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          className="titlebar-btn titlebar-btn--max"
          aria-label="Maximizar"
          onClick={() => windowClient.maximize()}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        </button>
        <button
          className="titlebar-btn titlebar-btn--close"
          aria-label="Fechar"
          onClick={() => windowClient.close()}
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

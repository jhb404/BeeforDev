import { useEffect, useState } from 'react';
import type { AppSettings, Coin2uDashboard } from '../../shared/types';
import { playUiCoin } from '../utils/alarm';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

function CoinIcon({ variant }: { variant: 'gold' | 'purple' }) {
  // Stylized coin: outer ring + inner star/diamond. Two-tone gradient via radial fill.
  const grad = variant === 'gold'
    ? { from: '#ffe287', mid: '#f3b919', edge: '#7d4d05' }
    : { from: '#cdb8ff', mid: '#7c5cbf', edge: '#3a256d' };
  return (
    <svg
      className={`coin2u-coin coin2u-coin--${variant}`}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`grad-${variant}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={grad.from} />
          <stop offset="65%" stopColor={grad.mid} />
          <stop offset="100%" stopColor={grad.edge} />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10.5" fill={`url(#grad-${variant})`} stroke={grad.edge} strokeWidth="1" />
      <circle cx="12" cy="12" r="7.5" fill="none" stroke={grad.edge} strokeOpacity="0.45" strokeWidth="0.6" />
      {variant === 'gold' ? (
        <path
          d="M12 7.2 L13.4 10.8 L17.2 11 L14.2 13.4 L15.2 17 L12 14.9 L8.8 17 L9.8 13.4 L6.8 11 L10.6 10.8 Z"
          fill={grad.edge}
          opacity="0.55"
        />
      ) : (
        <path
          d="M12 6.5 L15.5 12 L12 17.5 L8.5 12 Z"
          fill={grad.edge}
          opacity="0.5"
        />
      )}
      <ellipse cx="9.5" cy="8.5" rx="3" ry="1.6" fill="#fff" opacity="0.35" />
    </svg>
  );
}

interface Props {
  settings?: AppSettings | null;
}

export function Coin2uBadge({ settings }: Props = {}) {
  const [data, setData] = useState<Coin2uDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [bump, setBump] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setErrMsg(null);
    try {
      const res = await window.beefor.getCoin2uDashboard();
      if (res.ok && res.data) {
        setData(res.data);
      } else {
        setErrMsg(res.error ?? 'Falha');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    void (async () => {
      const creds = await window.beefor.getCoin2uCreds();
      const ready = !!(creds && creds.email);
      setConfigured(ready);
      if (!ready) return;
      void refresh();
      timer = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    })();
    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  if (configured === false || configured === null) return null;

  const handleClick = () => {
    if (settings?.uiSounds) void playUiCoin();
    setBump(true);
    setTimeout(() => setBump(false), 380);
    void refresh();
  };

  const tip = errMsg
    ? `Coin2U: ${errMsg}`
    : data
    ? `Coins: ${data.Coins} · Doar: ${data.ExchangeCoins} · Cotação: R$ ${data.CurrentQuotation.toFixed(2)} · Expira em ${data.DaysToExpire}d`
    : loading
    ? 'Coin2U: carregando...'
    : 'Coin2U';

  const goldVal = data?.Coins ?? 0;
  const purpleVal = data?.ExchangeCoins ?? 0;

  return (
    <button
      type="button"
      className={`coin2u-badge ${bump ? 'coin2u-badge--bump' : ''}`}
      onClick={handleClick}
      title={tip}
      disabled={loading}
    >
      <CoinIcon variant="gold" />
      <span className="coin2u-val">{loading && !data ? '…' : goldVal}</span>
      <span className="coin2u-sep" aria-hidden="true" />
      <CoinIcon variant="purple" />
      <span className="coin2u-val">{loading && !data ? '…' : purpleVal}</span>
    </button>
  );
}

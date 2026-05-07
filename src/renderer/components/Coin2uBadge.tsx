import { useEffect, useState } from 'react';
import type { Coin2uDashboard } from '../../shared/types';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function Coin2uBadge() {
  const [data, setData] = useState<Coin2uDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);

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
      const ready = !!(creds && creds.email && creds.userId);
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
      className="coin2u-badge"
      onClick={() => void refresh()}
      title={tip}
      disabled={loading}
    >
      <span className="coin2u-coin coin2u-coin--gold" aria-hidden="true" />
      <span className="coin2u-val">{loading && !data ? '…' : goldVal}</span>
      <span className="coin2u-sep" aria-hidden="true" />
      <span className="coin2u-coin coin2u-coin--purple" aria-hidden="true" />
      <span className="coin2u-val">{loading && !data ? '…' : purpleVal}</span>
    </button>
  );
}

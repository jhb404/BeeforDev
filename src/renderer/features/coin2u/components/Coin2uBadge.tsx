import { useEffect, useState } from 'react';
import type { AppSettings, Coin2uDashboard, Coin2uTransaction } from '@shared/types';
import { loadCoin2uCache, saveCoin2uCache, transactionSignature } from '../../../utils/coin2uCache';
import { playUiCoin, playUiNotify } from '../../../utils/alarm';
import { Coin2uModal } from './Coin2uModal';
import { CoinIcon } from './Coin2uCoinIcon';
import { coin2uClient } from '../../../services/ipc';
import { getError } from '@shared/result';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

interface Props {
  settings?: AppSettings | null;
}

export function Coin2uBadge({ settings }: Props = {}) {
  const cached = loadCoin2uCache();
  const [data, setData] = useState<Coin2uDashboard | null>(cached.dashboard);
  const [log, setLog] = useState<Coin2uTransaction[]>(cached.log);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [bump, setBump] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newCount, setNewCount] = useState(0);

  const refresh = async (notifyChange = false) => {
    setLoading(true);
    setErrMsg(null);
    try {
      const [dashRes, logRes] = await Promise.all([
        coin2uClient.getDashboard(),
        coin2uClient.getLog(),
      ]);
      if (dashRes.ok && dashRes.data) {
        const nextLog = logRes.ok && logRes.data ? logRes.data.Log : log;
        const before = loadCoin2uCache();
        const beforeSig = before.lastSeenSignature ?? transactionSignature(before.log);
        const nextSig = transactionSignature(nextLog);
        setData(dashRes.data);
        setLog(nextLog);
        saveCoin2uCache({
          dashboard: dashRes.data,
          log: nextLog,
          updatedAt: new Date().toISOString(),
          lastSeenSignature: nextSig,
        });
        if (notifyChange && beforeSig !== 'empty' && nextSig !== beforeSig) {
          setNewCount((prev) => prev + 1);
          if (settings?.uiSounds) void playUiNotify();
        }
      } else {
        setErrMsg(getError(dashRes) || 'Falha');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    void (async () => {
      const creds = await coin2uClient.getCreds();
      const ready = !!(creds && creds.email);
      setConfigured(ready);
      if (!ready) return;
      void refresh(false);
      timer = setInterval(() => void refresh(true), REFRESH_INTERVAL_MS);
    })();
    return () => {
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (configured === false || configured === null) return null;

  const handleClick = () => {
    if (settings?.uiSounds) void playUiCoin();
    setBump(true);
    window.setTimeout(() => setBump(false), 380);
    setNewCount(0);
    setModalOpen(true);
    saveCoin2uCache({
      dashboard: data,
      log,
      updatedAt: new Date().toISOString(),
      lastSeenSignature: transactionSignature(log),
    });
  };

  const tip = errMsg
    ? `Coin2U: ${errMsg}`
    : data
      ? `Coins: ${data.Coins} - Doar: ${data.ExchangeCoins} - Cotacao: R$ ${data.CurrentQuotation.toFixed(2)} - Expira em ${data.DaysToExpire}d`
      : loading
        ? 'Coin2U: carregando...'
        : 'Coin2U';

  const goldVal = data?.Coins ?? 0;
  const purpleVal = data?.ExchangeCoins ?? 0;

  return (
    <>
      <button
        type="button"
        className={`coin2u-badge ${bump ? 'coin2u-badge--bump' : ''}`}
        onClick={handleClick}
        title={tip}
        disabled={loading && !data}
        aria-label="Abrir coins Coin2U"
      >
        <CoinIcon variant="gold" />
        <span className="coin2u-val">{loading && !data ? '...' : goldVal}</span>
        <span className="coin2u-sep" aria-hidden="true" />
        <CoinIcon variant="purple" />
        <span className="coin2u-val">{loading && !data ? '...' : purpleVal}</span>
        {newCount > 0 && <span className="coin2u-notify-dot" aria-label="Novas transacoes" />}
      </button>
      <Coin2uModal
        open={modalOpen}
        settings={settings}
        onClose={() => setModalOpen(false)}
        onDataChanged={(nextDashboard, nextLog) => {
          setData(nextDashboard);
          setLog(nextLog);
          setNewCount(0);
        }}
      />
    </>
  );
}

import { useCallback, useMemo, useState } from 'react';
import type { Coin2uDashboard, Coin2uTransaction } from '@shared/types';
import { coin2uClient } from '../../../services/ipc';
import { loadCoin2uCache, saveCoin2uCache, transactionSignature } from '../../../utils/coin2uCache';
import { getError } from '@shared/result';

interface UseCoin2uDataOptions {
  onDataChanged?: (dashboard: Coin2uDashboard | null, log: Coin2uTransaction[]) => void;
}

interface UseCoin2uDataResult {
  dashboard: Coin2uDashboard | null;
  setDashboard: React.Dispatch<React.SetStateAction<Coin2uDashboard | null>>;
  log: Coin2uTransaction[];
  userId: number | null;
  setUserId: (id: number | null) => void;
  loading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
  refresh: () => Promise<void>;
  persist: (nextDashboard: Coin2uDashboard | null, nextLog: Coin2uTransaction[]) => void;
}

export function useCoin2uData({ onDataChanged }: UseCoin2uDataOptions): UseCoin2uDataResult {
  const cached = useMemo(() => loadCoin2uCache(), []);
  const [dashboard, setDashboard] = useState<Coin2uDashboard | null>(cached.dashboard);
  const [log, setLog] = useState<Coin2uTransaction[]>(cached.log);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback(
    (nextDashboard: Coin2uDashboard | null, nextLog: Coin2uTransaction[]) => {
      saveCoin2uCache({
        dashboard: nextDashboard,
        log: nextLog,
        updatedAt: new Date().toISOString(),
        lastSeenSignature: transactionSignature(nextLog),
      });
      onDataChanged?.(nextDashboard, nextLog);
    },
    [onDataChanged],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [creds, dashRes, logRes] = await Promise.all([
        coin2uClient.getCreds(),
        coin2uClient.getDashboard(),
        coin2uClient.getLog(),
      ]);
      if (creds?.userId) setUserId(creds.userId);
      if (!dashRes.ok || !dashRes.data) throw new Error(getError(dashRes) || 'Falha no dashboard.');
      if (!logRes.ok || !logRes.data) throw new Error(getError(logRes) || 'Falha no historico.');
      setDashboard(dashRes.data);
      setLog(logRes.data.Log);
      persist(dashRes.data, logRes.data.Log);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [persist]);

  return {
    dashboard,
    setDashboard,
    log,
    userId,
    setUserId,
    loading,
    error,
    setError,
    refresh,
    persist,
  };
}

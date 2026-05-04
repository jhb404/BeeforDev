import { useCallback, useEffect, useState } from 'react';
import type { SessionStatus } from '../../shared/types';

export function useBeefor() {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void window.beefor.getStatus().then(setStatus);
    const off = window.beefor.onStatus(setStatus);
    return off;
  }, []);

  const wrap = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      setBusy(true);
      try {
        return await fn();
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return { status, busy, wrap };
}

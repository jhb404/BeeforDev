import { useCallback, useEffect, useState } from 'react';
import type { SessionStatus } from '@shared/types';
import { sessionClient } from '../services/ipc';

export function useBeefor() {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void sessionClient.getStatus().then(setStatus);
    const off = sessionClient.onStatus(setStatus);
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

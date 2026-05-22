import { useCallback, useEffect, useRef, useState } from 'react';
import type { SessionStatus } from '@shared/types/index';
import { useIpc } from '../services/ipc';

export type BusyKey =
  | 'mood'
  | 'autoLancamento'
  | 'lancarHora'
  | 'kudo'
  | 'atividades'
  | 'timesheet'
  | 'global';

export function useBeefor() {
  const { session: sessionClient } = useIpc();
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [busyKeys, setBusyKeys] = useState<Set<BusyKey>>(new Set());
  const busyRef = useRef<Set<BusyKey>>(new Set());

  useEffect(() => {
    void sessionClient.getStatus().then(setStatus);
    const off = sessionClient.onStatus(setStatus);
    return off;
  }, [sessionClient]);

  const setKey = useCallback((key: BusyKey, on: boolean) => {
    const next = new Set(busyRef.current);
    if (on) next.add(key);
    else next.delete(key);
    busyRef.current = next;
    setBusyKeys(next);
  }, []);

  /**
   * wrap(fn) — global busy (compat legado).
   * wrap(key, fn) — busy só da ação `key`, sem travar outras (HTTP paralelo).
   */
  const wrap = useCallback(
    async <T>(
      keyOrFn: BusyKey | (() => Promise<T>),
      maybeFn?: () => Promise<T>,
    ): Promise<T> => {
      const key: BusyKey = typeof keyOrFn === 'string' ? keyOrFn : 'global';
      const fn = typeof keyOrFn === 'function' ? keyOrFn : maybeFn!;
      setKey(key, true);
      try {
        return await fn();
      } finally {
        setKey(key, false);
      }
    },
    [setKey],
  );

  const isBusy = useCallback(
    (key?: BusyKey) => (key ? busyKeys.has(key) : busyKeys.size > 0),
    [busyKeys],
  );

  // `busy` legado = qualquer ação ativa (compat com callers antigos)
  const busy = busyKeys.size > 0;

  return { status, busy, isBusy, wrap };
}

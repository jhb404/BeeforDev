import { useCallback, useEffect, useRef, useState } from 'react';
import { useIpc } from '../../services/ipc';
import { playAlarmByKind } from '../../utils/alarm';

interface ToastFn {
  (toast: { kind: 'ok' | 'err'; title?: string; msg: string; persistent?: boolean }, ttl?: number): void;
}

export function useLunchTimer(showToast: ToastFn) {
  const { system: systemClient } = useIpc();
  const [lunchTimerActive, setLunchTimerActive] = useState(false);
  const [lunchStartedAt, setLunchStartedAt] = useState<number | null>(null);
  const lunchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (lunchTimerRef.current) clearTimeout(lunchTimerRef.current);
    lunchTimerRef.current = null;
  }, []);

  const startLunchTimer = useCallback(() => {
    clearTimer();
    const now = Date.now();
    setLunchTimerActive(true);
    setLunchStartedAt(now);
    systemClient.setLunchTimerActive(true);
    void playAlarmByKind('lunch');
    void systemClient.notifyWindows('🍽️ Alerta Almoço', 'Timer de 1h iniciado. Bom apetite!');
    showToast({ kind: 'ok', msg: 'Timer de almoço iniciado — 1 hora.' });
    lunchTimerRef.current = setTimeout(
      () => {
        setLunchTimerActive(false);
        setLunchStartedAt(null);
        systemClient.setLunchTimerActive(false);
        showToast({ kind: 'ok', title: 'Almoço encerrado!', msg: 'Já passou 1 hora de almoço.' });
        lunchTimerRef.current = null;
      },
      60 * 60 * 1000,
    );
  }, [clearTimer, showToast, systemClient]);

  const cancelLunchTimer = useCallback(() => {
    clearTimer();
    setLunchTimerActive(false);
    setLunchStartedAt(null);
    systemClient.setLunchTimerActive(false);
    showToast({ kind: 'ok', msg: 'Timer de almoço cancelado.' });
  }, [clearTimer, showToast, systemClient]);

  useEffect(() => clearTimer, [clearTimer]);

  return {
    lunchTimerActive,
    lunchStartedAt,
    startLunchTimer,
    cancelLunchTimer,
  };
}

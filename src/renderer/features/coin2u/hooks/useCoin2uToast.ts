import { useEffect, useState } from 'react';

export type Coin2uToastState = { kind: 'ok' | 'err'; msg: string } | null;

interface UseCoin2uToastResult {
  toast: Coin2uToastState;
  showToast: (kind: 'ok' | 'err', msg: string) => void;
  clearToast: () => void;
}

export function useCoin2uToast(open: boolean): UseCoin2uToastResult {
  const [toast, setToast] = useState<Coin2uToastState>(null);

  useEffect(() => {
    if (!open) setToast(null);
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return {
    toast,
    showToast: (kind, msg) => setToast({ kind, msg }),
    clearToast: () => setToast(null),
  };
}

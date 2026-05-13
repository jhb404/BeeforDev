import { createContext, useCallback, useContext, useRef, useState } from 'react';

export interface ToastData {
  kind: 'ok' | 'err';
  title?: string;
  msg: string;
}

interface ToastCtx {
  show: (t: ToastData, durationMs?: number) => void;
  toast: ToastData | null;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((t: ToastData, durationMs = 3500) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(t);
    timerRef.current = setTimeout(() => setToast(null), durationMs);
  }, []);

  return <Ctx.Provider value={{ show, toast }}>{children}</Ctx.Provider>;
}

export function useToast(): (t: ToastData, durationMs?: number) => void {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx.show;
}

export function useToastState(): ToastData | null {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToastState must be inside ToastProvider');
  return ctx.toast;
}

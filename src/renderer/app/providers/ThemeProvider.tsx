import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light';

type ThemeCtx = {
  theme: ThemeMode;
  toggle: (origin?: { x: number; y: number }) => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem('beefor-theme');
  return saved === 'light' ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('beefor-theme', theme);
  }, [theme]);

  const toggle = (origin?: { x: number; y: number }) => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    const vt = (document as Document & { startViewTransition?: (cb: () => void) => unknown })
      .startViewTransition;

    if (vt && origin) {
      root.style.setProperty('--theme-x', `${origin.x}px`);
      root.style.setProperty('--theme-y', `${origin.y}px`);
      const dx = Math.max(origin.x, window.innerWidth - origin.x);
      const dy = Math.max(origin.y, window.innerHeight - origin.y);
      const radius = Math.hypot(dx, dy);
      root.style.setProperty('--theme-radius', `${radius}px`);
      root.classList.add('theme-ripple');
      const t = vt.call(document, () => setTheme(next)) as { finished?: Promise<void> };
      void Promise.resolve(t?.finished).finally(() => {
        root.classList.remove('theme-ripple');
      });
    } else {
      root.classList.add('theme-anim');
      setTheme(next);
      window.setTimeout(() => root.classList.remove('theme-anim'), 360);
    }
  };

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme must be used inside ThemeProvider');
  return v;
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

const LS_KEY = 'beefor:ativ-split-ratio';
const RATIO_MIN = 0.25;
const RATIO_MAX = 0.75;
const RATIO_DEFAULT = 0.45;

function loadRatio(): number {
  try {
    const v = parseFloat(localStorage.getItem(LS_KEY) ?? '');
    if (v >= RATIO_MIN && v <= RATIO_MAX) return v;
  } catch {
    /* ignore */
  }
  return RATIO_DEFAULT;
}

export function useResizeSplit(active: boolean) {
  const [ratio, setRatio] = useState(loadRatio);
  const bodyRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMouseDown = useCallback((e: ReactMouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    if (!active) return;
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !bodyRef.current) return;
      const rect = bodyRef.current.getBoundingClientRect();
      const newRatio = Math.min(
        RATIO_MAX,
        Math.max(RATIO_MIN, (e.clientX - rect.left) / rect.width),
      );
      setRatio(newRatio);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setRatio((r) => {
        try {
          localStorage.setItem(LS_KEY, String(r));
        } catch {
          /* ignore */
        }
        return r;
      });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [active]);

  return { ratio, bodyRef, onMouseDown };
}

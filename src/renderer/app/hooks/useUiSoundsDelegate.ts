import { useEffect } from 'react';
import { playUiClick, playUiSound, type UiSoundKind } from '../../utils/alarm';

/**
 * Global delegated handler for click sounds. Activates only when `enabled` is true.
 * Mutes generic clicks inside `.kudo-history-list` to avoid spam.
 */
export function useUiSoundsDelegate(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest('button, [role="button"], [data-sound]') as HTMLElement | null;
      if (!btn) return;
      if ((btn as HTMLButtonElement).disabled) return;
      if (target.closest('.kudo-history-list') && !btn.dataset.sound) return;
      const kind = btn.dataset.sound as UiSoundKind | undefined;
      if (kind) playUiSound(kind);
      else void playUiClick();
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [enabled]);
}

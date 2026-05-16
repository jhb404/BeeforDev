import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IpcProvider } from '../../services/ipc';
import { createFakeIpcClients } from '../../../test/factories/ipc';
import { useTrayListeners } from './useTrayListeners';

describe('useTrayListeners', () => {
  it('registers tray callbacks and removes all listeners on cleanup', () => {
    const offLunch = vi.fn();
    const offKudo = vi.fn();
    const offCoins = vi.fn();
    let lunchCb: (() => void) | undefined;
    let kudoCb: (() => void) | undefined;
    let coinsCb: (() => void) | undefined;
    const clients = createFakeIpcClients({
      system: {
        ...createFakeIpcClients().system,
        onTrayLunchTimer: vi.fn((cb) => {
          lunchCb = cb;
          return offLunch;
        }),
        onTrayOpenKudo: vi.fn((cb) => {
          kudoCb = cb;
          return offKudo;
        }),
        onTrayOpenCoins: vi.fn((cb) => {
          coinsCb = cb;
          return offCoins;
        }),
      },
    });
    const onLunchTimer = vi.fn();
    const onOpenKudo = vi.fn();
    const onOpenCoins = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <IpcProvider clients={clients}>{children}</IpcProvider>
    );

    const { unmount } = renderHook(
      () => useTrayListeners({ onLunchTimer, onOpenKudo, onOpenCoins }),
      { wrapper },
    );

    lunchCb?.();
    kudoCb?.();
    coinsCb?.();

    expect(onLunchTimer).toHaveBeenCalledTimes(1);
    expect(onOpenKudo).toHaveBeenCalledTimes(1);
    expect(onOpenCoins).toHaveBeenCalledTimes(1);

    unmount();

    expect(offLunch).toHaveBeenCalledTimes(1);
    expect(offKudo).toHaveBeenCalledTimes(1);
    expect(offCoins).toHaveBeenCalledTimes(1);
  });
});

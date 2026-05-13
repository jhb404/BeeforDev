import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEscapeToClose } from './useEscapeToClose';

function pressKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }));
}

describe('useEscapeToClose', () => {
  it('calls onEscape when Escape pressed and active', () => {
    const fn = vi.fn();
    renderHook(() => useEscapeToClose(true, fn));
    pressKey('Escape');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape when not active', () => {
    const fn = vi.fn();
    renderHook(() => useEscapeToClose(false, fn));
    pressKey('Escape');
    expect(fn).not.toHaveBeenCalled();
  });

  it('ignores other keys', () => {
    const fn = vi.fn();
    renderHook(() => useEscapeToClose(true, fn));
    pressKey('Enter');
    pressKey(' ');
    expect(fn).not.toHaveBeenCalled();
  });

  it('cleans up listener on unmount', () => {
    const fn = vi.fn();
    const { unmount } = renderHook(() => useEscapeToClose(true, fn));
    unmount();
    pressKey('Escape');
    expect(fn).not.toHaveBeenCalled();
  });

  it('removes listener when active flips to false', () => {
    const fn = vi.fn();
    const { rerender } = renderHook(({ active }) => useEscapeToClose(active, fn), {
      initialProps: { active: true },
    });
    rerender({ active: false });
    pressKey('Escape');
    expect(fn).not.toHaveBeenCalled();
  });
});

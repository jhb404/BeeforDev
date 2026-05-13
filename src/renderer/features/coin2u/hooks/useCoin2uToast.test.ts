import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCoin2uToast } from './useCoin2uToast';

describe('useCoin2uToast', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts with null toast', () => {
    const { result } = renderHook(() => useCoin2uToast(true));
    expect(result.current.toast).toBeNull();
  });

  it('showToast sets toast state', () => {
    const { result } = renderHook(() => useCoin2uToast(true));
    act(() => result.current.showToast('ok', 'success'));
    expect(result.current.toast).toEqual({ kind: 'ok', msg: 'success' });
  });

  it('auto-clears after 2800ms', () => {
    const { result } = renderHook(() => useCoin2uToast(true));
    act(() => result.current.showToast('err', 'fail'));
    expect(result.current.toast).not.toBeNull();
    act(() => vi.advanceTimersByTime(2800));
    expect(result.current.toast).toBeNull();
  });

  it('clearToast removes toast', () => {
    const { result } = renderHook(() => useCoin2uToast(true));
    act(() => result.current.showToast('ok', 'hi'));
    act(() => result.current.clearToast());
    expect(result.current.toast).toBeNull();
  });

  it('clears toast when open flips to false', () => {
    const { result, rerender } = renderHook(({ open }) => useCoin2uToast(open), {
      initialProps: { open: true },
    });
    act(() => result.current.showToast('ok', 'hi'));
    rerender({ open: false });
    expect(result.current.toast).toBeNull();
  });
});

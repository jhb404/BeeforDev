import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSlowHint } from './useSlowHint';

describe('useSlowHint', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns null initially', () => {
    const { result } = renderHook(() => useSlowHint(false, 100));
    expect(result.current).toBeNull();
  });

  it('returns null while loading false', () => {
    const { result } = renderHook(() => useSlowHint(false, 100));
    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBeNull();
  });

  it('returns hint after delay when loading', () => {
    const { result } = renderHook(() => useSlowHint(true, 100));
    expect(result.current).toBeNull();
    act(() => vi.advanceTimersByTime(150));
    expect(result.current).toBeTruthy();
    expect(typeof result.current).toBe('string');
  });

  it('clears hint when loading flips back to false', () => {
    const { result, rerender } = renderHook(({ loading }) => useSlowHint(loading, 100), {
      initialProps: { loading: true },
    });
    act(() => vi.advanceTimersByTime(150));
    expect(result.current).toBeTruthy();
    rerender({ loading: false });
    expect(result.current).toBeNull();
  });

  it('clears pending timer when loading flips before delay', () => {
    const { result, rerender } = renderHook(({ loading }) => useSlowHint(loading, 100), {
      initialProps: { loading: true },
    });
    act(() => vi.advanceTimersByTime(50));
    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBeNull();
  });
});

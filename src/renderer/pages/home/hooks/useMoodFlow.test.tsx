import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMoodFlow } from './useMoodFlow';

describe('useMoodFlow', () => {
  it('refreshes current mood and sanitizes unknown values', async () => {
    const moodClient = {
      getCurrent: vi.fn(async () => ({ ok: true as const, data: 'valor inválido' })),
      select: vi.fn(async () => ({ ok: true as const, data: undefined })),
    };
    const onMoodChanged = vi.fn();
    const { result } = renderHook(() =>
      useMoodFlow({
        ready: true,
        moodClient,
        wrap: async (fn) => fn(),
        showToast: vi.fn(),
        onMoodChanged,
      }),
    );

    await act(async () => {
      await result.current.refreshMood();
    });

    expect(result.current.currentMood).toBeNull();
    expect(result.current.moodLoaded).toBe(true);
    expect(onMoodChanged).toHaveBeenCalledWith(null);
  });

  it('rolls back optimistic mood when save fails', async () => {
    const moodClient = {
      getCurrent: vi.fn(async () => ({ ok: true as const, data: 'Dia feliz' })),
      select: vi.fn(async () => ({ ok: false as const, error: 'falhou' })),
    };
    const showToast = vi.fn();
    const onMoodChanged = vi.fn();
    const { result } = renderHook(() =>
      useMoodFlow({
        ready: false,
        moodClient,
        wrap: async (fn) => fn(),
        showToast,
        onMoodChanged,
      }),
    );

    await act(async () => {
      await result.current.refreshMood();
    });
    await act(async () => {
      await result.current.selectMood('Dia bom');
    });

    expect(result.current.currentMood).toBe('Dia feliz');
    expect(onMoodChanged).toHaveBeenLastCalledWith('Dia feliz');
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'err', title: 'Mood não salvo' }),
    );
  });

  it('refreshes mood when document becomes visible', async () => {
    const moodClient = {
      getCurrent: vi.fn(async () => ({ ok: true as const, data: 'Dia bom' })),
      select: vi.fn(async () => ({ ok: true as const, data: undefined })),
    };

    renderHook(() =>
      useMoodFlow({
        ready: true,
        moodClient,
        wrap: async (fn) => fn(),
        showToast: vi.fn(),
      }),
    );

    await act(async () => undefined);
    expect(moodClient.getCurrent).not.toHaveBeenCalled();

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => expect(moodClient.getCurrent).toHaveBeenCalledTimes(1));
  });
});

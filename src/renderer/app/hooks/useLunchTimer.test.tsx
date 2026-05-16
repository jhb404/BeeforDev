import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IpcProvider } from '../../services/ipc';
import { createFakeIpcClients } from '../../../test/factories/ipc';
import { useLunchTimer } from './useLunchTimer';

vi.mock('../../utils/alarm', () => ({
  playAlarmByKind: vi.fn(async () => undefined),
}));

describe('useLunchTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts timer, notifies main process, and clears after one hour', async () => {
    const clients = createFakeIpcClients();
    const showToast = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <IpcProvider clients={clients}>{children}</IpcProvider>
    );
    const { result } = renderHook(() => useLunchTimer(showToast), { wrapper });

    act(() => result.current.startLunchTimer());

    expect(result.current.lunchTimerActive).toBe(true);
    expect(result.current.lunchStartedAt).toEqual(expect.any(Number));
    expect(clients.system.setLunchTimerActive).toHaveBeenCalledWith(true);
    expect(clients.system.notifyWindows).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    });

    expect(result.current.lunchTimerActive).toBe(false);
    expect(result.current.lunchStartedAt).toBeNull();
    expect(clients.system.setLunchTimerActive).toHaveBeenLastCalledWith(false);
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'ok', title: expect.any(String) }),
    );
  });

  it('cancels active timer and prevents completion side effects', async () => {
    const clients = createFakeIpcClients();
    const showToast = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <IpcProvider clients={clients}>{children}</IpcProvider>
    );
    const { result } = renderHook(() => useLunchTimer(showToast), { wrapper });

    act(() => result.current.startLunchTimer());
    act(() => result.current.cancelLunchTimer());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    });

    expect(result.current.lunchTimerActive).toBe(false);
    expect(result.current.lunchStartedAt).toBeNull();
    expect(clients.system.setLunchTimerActive).toHaveBeenLastCalledWith(false);
    expect(showToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.any(String) }),
    );
  });
});

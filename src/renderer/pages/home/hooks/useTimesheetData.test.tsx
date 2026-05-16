import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createFakeIpcClients } from '../../../../test/factories/ipc';
import { useTimesheetData } from './useTimesheetData';

const row = {
  date: '2026-05-15',
  entrada: '08:00',
  int1: '12:00',
  ret1: '13:00',
  int2: '',
  ret2: '',
  saida: '17:00',
  comentario: '',
  total: '08:00',
  status: '',
  editable: true,
};

describe('useTimesheetData', () => {
  it('fetches selected month when ready and exposes merged rows', async () => {
    const clients = createFakeIpcClients();
    clients.timesheet.fetch = vi.fn(async () => ({ ok: true as const, data: [row] }));
    const { result } = renderHook(() =>
      useTimesheetData({
        ready: true,
        year: 2026,
        month: 5,
        moodLoaded: true,
        timesheetClient: clients.timesheet,
        systemClient: clients.system,
        refreshMood: vi.fn(async () => undefined),
        showToast: vi.fn(),
      }),
    );

    await waitFor(() => expect(clients.timesheet.fetch).toHaveBeenCalledWith(2026, 5));
    await waitFor(() => expect(result.current.timesheetLoaded).toBe(true));

    expect(result.current.rows).toHaveLength(31);
    expect(result.current.rows.find((item) => item.date === row.date)?.entrada).toBe('08:00');
  });

  it('refetches current month when auto launch sync succeeds', async () => {
    let notifyCb: ((info: { title: string; body: string }) => void) | undefined;
    const clients = createFakeIpcClients();
    clients.timesheet.fetch = vi.fn(async () => ({ ok: true as const, data: [row] }));
    clients.system.onNotify = vi.fn((cb) => {
      notifyCb = cb;
      return vi.fn();
    });

    renderHook(() =>
      useTimesheetData({
        ready: true,
        year: 2026,
        month: 5,
        moodLoaded: true,
        timesheetClient: clients.timesheet,
        systemClient: clients.system,
        refreshMood: vi.fn(async () => undefined),
        showToast: vi.fn(),
      }),
    );

    await waitFor(() => expect(clients.timesheet.fetch).toHaveBeenCalledTimes(1));
    notifyCb?.({ title: 'sync:autoLancamento', body: 'ok' });

    await waitFor(() => expect(clients.timesheet.fetch).toHaveBeenCalledTimes(2));
    expect(clients.timesheet.fetch).toHaveBeenLastCalledWith(2026, 5);
  });

  it('refreshes mood when auto launch sync fails', async () => {
    let notifyCb: ((info: { title: string; body: string }) => void) | undefined;
    const refreshMood = vi.fn(async () => undefined);
    const clients = createFakeIpcClients();
    clients.timesheet.fetch = vi.fn(async () => ({ ok: true as const, data: [] }));
    clients.system.onNotify = vi.fn((cb) => {
      notifyCb = cb;
      return vi.fn();
    });

    renderHook(() =>
      useTimesheetData({
        ready: false,
        year: 2026,
        month: 5,
        moodLoaded: true,
        timesheetClient: clients.timesheet,
        systemClient: clients.system,
        refreshMood,
        showToast: vi.fn(),
      }),
    );

    notifyCb?.({ title: 'sync:autoLancamento', body: 'failed' });

    await waitFor(() => expect(refreshMood).toHaveBeenCalledTimes(1));
  });
});

import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IpcProvider } from '../../services/ipc';
import { createFakeIpcClients, defaultSettings } from '../../../test/factories/ipc';
import { usePatchJournal } from './usePatchJournal';

describe('usePatchJournal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('opens modal, marks badge as seen, and loads journal text', async () => {
    const clients = createFakeIpcClients({
      settings: {
        get: vi.fn(async () => ({
          ...defaultSettings(),
          patchJournal: '  versão nova  ',
        })),
        set: vi.fn(async () => ({ ok: true as const, data: undefined })),
      },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <IpcProvider clients={clients}>{children}</IpcProvider>
    );
    const { result } = renderHook(() => usePatchJournal(), { wrapper });

    await act(async () => {
      await result.current.openPatchJournal();
    });

    expect(result.current.patchModalOpen).toBe(true);
    expect(result.current.loadingPatchJournal).toBe(false);
    expect(result.current.patchJournal).toBe('versão nova');
    expect(localStorage.getItem('beefor-last-seen-version')).toBe('0.0.0');
  });

  it('uses fallback text when settings journal is empty', async () => {
    const clients = createFakeIpcClients({
      settings: {
        get: vi.fn(async () => ({
          ...defaultSettings(),
          patchJournal: ' ',
        })),
        set: vi.fn(async () => ({ ok: true as const, data: undefined })),
      },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <IpcProvider clients={clients}>{children}</IpcProvider>
    );
    const { result } = renderHook(() => usePatchJournal(), { wrapper });

    await act(async () => {
      await result.current.openPatchJournal();
    });

    await waitFor(() => expect(result.current.loadingPatchJournal).toBe(false));
    expect(result.current.patchJournal).toBe('Nenhuma atualizacao publicada ainda.');

    act(() => result.current.closePatchJournal());
    expect(result.current.patchModalOpen).toBe(false);
  });
});

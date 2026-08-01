import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { createFakeIpcClients } from '../../../test/factories/ipc';
import { IpcProvider } from '../../services/ipc';
import { AccessProvider, useAccess } from './AccessProvider';

type SessionInfo = {
  idPessoa: string;
  idOrganizacao: string | null;
  usaTimeSheetBeefor: boolean;
  usaSomenteTimeSheetBeefor: boolean;
};

function setHttp(sessionInfo: (() => Promise<unknown>) | null) {
  if (!sessionInfo) {
    Reflect.deleteProperty(window, 'beeforHttp');
    return;
  }
  Object.defineProperty(window, 'beeforHttp', {
    value: { sessionInfo },
    configurable: true,
    writable: true,
  });
}

function wrapper(children: ReactNode) {
  // Sessão 'connected': é o gatilho pro AccessProvider consultar o sessionInfo.
  const clients = createFakeIpcClients();
  clients.session.getStatus = vi.fn(async () => 'connected' as const);
  return (
    <IpcProvider clients={clients}>
      <AccessProvider>{children}</AccessProvider>
    </IpcProvider>
  );
}

function renderAccess() {
  return renderHook(() => useAccess(), {
    wrapper: ({ children }) => wrapper(children),
  });
}

function info(over: Partial<SessionInfo> = {}): SessionInfo {
  return {
    idPessoa: 'p1',
    idOrganizacao: 'o1',
    usaTimeSheetBeefor: true,
    usaSomenteTimeSheetBeefor: false,
    ...over,
  };
}

afterEach(() => {
  setHttp(null);
});

describe('AccessProvider', () => {
  it('marca semTimesheet quando usaTimeSheetBeefor vem false', async () => {
    setHttp(async () => ({ ok: true, data: info({ usaTimeSheetBeefor: false }) }));
    const { result } = renderAccess();

    await waitFor(() => expect(result.current.usaTimesheet).toBe(false));
    expect(result.current.semTimesheet).toBe(true);
  });

  it('libera a UI de ponto quando usaTimeSheetBeefor vem true', async () => {
    setHttp(async () => ({ ok: true, data: info() }));
    const { result } = renderAccess();

    await waitFor(() => expect(result.current.usaTimesheet).toBe(true));
    expect(result.current.semTimesheet).toBe(false);
  });

  it('expõe somenteTimesheet a partir de usaSomenteTimeSheetBeefor', async () => {
    setHttp(async () => ({ ok: true, data: info({ usaSomenteTimeSheetBeefor: true }) }));
    const { result } = renderAccess();

    await waitFor(() => expect(result.current.somenteTimesheet).toBe(true));
  });

  it('fail-open: sem window.beeforHttp não esconde nada', async () => {
    setHttp(null);
    const { result } = renderAccess();

    await waitFor(() => expect(result.current.usaTimesheet).toBeNull());
    expect(result.current.semTimesheet).toBe(false);
  });
});

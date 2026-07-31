import type { BrowserWindow } from 'electron';
import { IPC } from '../shared/ipc/index';
import type { SessionStatus } from '../shared/types/index';

let currentStatus: SessionStatus = 'idle';

export function emitStatus(win: BrowserWindow | null, s: SessionStatus): void {
  const wasConnected = currentStatus === 'connected';
  currentStatus = s;
  if (win && !win.isDestroyed()) win.webContents.send(IPC.EVT_STATUS, s);

  // O tray é montado antes do login, quando ainda não se sabe se a pessoa usa
  // TimeSheet Beefor. Ao conectar, reconstrói pra aplicar o filtro de acesso.
  // Import dinâmico: evita ciclo statusBus ↔ tray.
  if (s === 'connected' && !wasConnected) {
    void import('./bootstrap/tray')
      .then((m) => m.rebuildTrayMenu())
      .catch(() => {
        /* tray pode não existir (testes/headless) — ignora */
      });
  }
}

export function getCurrentStatus(): SessionStatus {
  return currentStatus;
}

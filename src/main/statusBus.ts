import type { BrowserWindow } from 'electron';
import { IPC } from '../shared/ipc';
import type { SessionStatus } from '../shared/types';

let currentStatus: SessionStatus = 'idle';

export function emitStatus(win: BrowserWindow | null, s: SessionStatus): void {
  currentStatus = s;
  if (win && !win.isDestroyed()) win.webContents.send(IPC.EVT_STATUS, s);
}

export function getCurrentStatus(): SessionStatus {
  return currentStatus;
}

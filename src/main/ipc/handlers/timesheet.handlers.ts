import { BrowserWindow, ipcMain, shell } from 'electron';
import { IPC } from '../../../shared/ipc';
import type { TimesheetEntry } from '../../../shared/types';
import { BEEFOR_LOGIN_URL } from '../../../shared/constants';
import {
  doAutoLancamento,
  doFetchTimesheet,
  doLancarHora,
} from '../../../automation/beefor/beeforActions';
import { logger } from '../../logger';
import { ok, fail, withTimeout } from '../../services/result';
import { runBeeforAction, runBeeforActionWithReconnect } from '../../services/beeforActionRunner';

export function registerTimesheetHandlers(getWindow: () => BrowserWindow | null) {
  ipcMain.handle(IPC.ACTION_AUTO_LANCAMENTO, async () => {
    const win = getWindow();
    try {
      await runBeeforActionWithReconnect(win, 'Auto lançamento', (page) => doAutoLancamento(page));
      win?.webContents.send(IPC.EVT_NOTIFY, {
        title: 'sync:autoLancamento',
        body: 'ok',
      });
      return ok();
    } catch (err) {
      logger.error('Auto lançamento failed', err);
      win?.webContents.send(IPC.EVT_NOTIFY, {
        title: 'sync:autoLancamento',
        body: 'failed',
      });
      return fail(err);
    }
  });

  ipcMain.handle(IPC.ACTION_OPEN_BEEFOR, async () => {
    try {
      await shell.openExternal(BEEFOR_LOGIN_URL);
      return ok();
    } catch (err) {
      return fail(err);
    }
  });

  ipcMain.handle(IPC.ACTION_LANCAR_HORA, async (_e, entry: TimesheetEntry) => {
    const win = getWindow();
    try {
      await runBeeforAction(win, (page) => doLancarHora(page, entry));
      return ok();
    } catch (err) {
      logger.error('Lançar hora failed', err);
      return fail(err);
    }
  });

  ipcMain.handle(IPC.ACTION_FETCH_TIMESHEET, async (_e, year: number, month: number) => {
    const win = getWindow();
    try {
      const rows = await withTimeout(
        runBeeforAction(win, (page) => doFetchTimesheet(page, year, month)),
        60_000,
        'Fetch timesheet',
      );
      return ok(rows);
    } catch (err) {
      logger.error('Fetch timesheet failed', err);
      return fail(err);
    }
  });
}

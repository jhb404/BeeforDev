import { BrowserWindow, ipcMain, shell } from 'electron';
import { IPC } from '../../../shared/ipc';
import { BEEFOR_LOGIN_URL } from '../../../shared/constants';
import {
  doAutoLancamento,
  doFetchTimesheet,
  doLancarHora,
} from '../../../automation/beefor/beeforActions';
import { logger } from '../../logger';
import { ok, fail, withTimeout } from '../../services/result';
import { runBeeforAction, runBeeforActionWithReconnect } from '../../services/beeforActionRunner';
import { fetchTimesheetArgsSchema, timesheetEntrySchema } from '../schemas';
import { validate } from '../validate';

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

  ipcMain.handle(IPC.ACTION_LANCAR_HORA, async (_e, payload: unknown) => {
    const parsed = validate(timesheetEntrySchema, payload);
    if (!parsed.ok) return parsed.result;
    const win = getWindow();
    try {
      await runBeeforAction(win, (page) => doLancarHora(page, parsed.data));
      return ok();
    } catch (err) {
      logger.error('Lançar hora failed', err);
      return fail(err);
    }
  });

  ipcMain.handle(IPC.ACTION_FETCH_TIMESHEET, async (_e, year: unknown, month: unknown) => {
    const parsed = validate(fetchTimesheetArgsSchema, [year, month]);
    if (!parsed.ok) return parsed.result;
    const [pYear, pMonth] = parsed.data;
    const win = getWindow();
    try {
      const rows = await withTimeout(
        runBeeforAction(win, (page) => doFetchTimesheet(page, pYear, pMonth)),
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

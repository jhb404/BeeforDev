import type { BrowserWindow } from 'electron';
import { IPC } from '../../../shared/ipc/index';
import { BEEFOR_LOGIN_URL } from '../../../shared/constants';
import { openExternalSafe } from '../../openSafe';
import {
  doAutoLancamento,
  doFetchTimesheet,
  doLancarHora,
} from '../../../automation/beefor/actions';
import { ok, fail, withTimeout } from '../../../shared/result';
import { runBeeforAction, runBeeforActionWithReconnect } from '../../services/beeforActionRunner';
import { fetchTimesheetArgsSchema, timesheetEntrySchema } from '../schemas';
import { defineHandler } from '../defineHandler';

export function registerTimesheetHandlers(getWindow: () => BrowserWindow | null) {
  defineHandler({
    channel: IPC.ACTION_AUTO_LANCAMENTO,
    errorMessage: 'Auto lançamento failed',
    onError: () => {
      getWindow()?.webContents.send(IPC.EVT_NOTIFY, {
        title: 'sync:autoLancamento',
        body: 'failed',
      });
    },
    run: async () => {
      const win = getWindow();
      await runBeeforActionWithReconnect(win, 'Auto lançamento', (page) => doAutoLancamento(page));
      win?.webContents.send(IPC.EVT_NOTIFY, {
        title: 'sync:autoLancamento',
        body: 'ok',
      });
      return ok();
    },
  });

  defineHandler({
    channel: IPC.ACTION_OPEN_BEEFOR,
    errorMessage: 'Open Beefor failed',
    run: async () => {
      const success = await openExternalSafe(BEEFOR_LOGIN_URL);
      return success ? ok() : fail(new Error('URL rejeitada.'));
    },
  });

  defineHandler({
    channel: IPC.ACTION_LANCAR_HORA,
    schema: timesheetEntrySchema,
    errorMessage: 'Lançar hora failed',
    run: async ({ data }) => {
      const win = getWindow();
      await runBeeforAction(win, (page) => doLancarHora(page, data));
      return ok();
    },
  });

  defineHandler({
    channel: IPC.ACTION_FETCH_TIMESHEET,
    schema: fetchTimesheetArgsSchema,
    payload: (args) => args,
    errorMessage: 'Fetch timesheet failed',
    run: async ({ data }) => {
      const [year, month] = data;
      const win = getWindow();
      const rows = await withTimeout(
        runBeeforAction(win, (page) => doFetchTimesheet(page, year, month)),
        60_000,
        'Fetch timesheet',
      );
      return ok(rows);
    },
  });
}

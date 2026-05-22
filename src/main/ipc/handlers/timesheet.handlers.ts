import type { BrowserWindow } from 'electron';
import { IPC } from '../../../shared/ipc/index';
import { BEEFOR_LOGIN_URL } from '../../../shared/constants';
import { openExternalSafe } from '../../openSafe';
import { ok, fail } from '../../../shared/result';
import {
  autoLancarApontamentos,
  getMonthPayload,
  lancarHora,
} from '../../services/beeforTimesheetService';
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
      await autoLancarApontamentos();
      win?.webContents.send(IPC.EVT_NOTIFY, { title: 'sync:autoLancamento', body: 'ok' });
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
      await lancarHora({
        date: data.date,
        entrada: data.entrada,
        int1: data.int1,
        ret1: data.ret1,
        int2: data.int2,
        ret2: data.ret2,
        saida: data.saida,
        comentario: data.comentario,
      });
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
      const payload = await getMonthPayload(year, month);
      return ok(payload);
    },
  });
}

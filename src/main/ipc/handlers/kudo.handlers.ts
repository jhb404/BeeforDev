import { BrowserWindow, ipcMain } from 'electron';
import { IPC } from '../../../shared/ipc/index';
import {
  doFetchKudoCounts,
  doFetchKudoDetail,
  doFetchKudoLists,
  doSearchKudoRecipient,
  doSendKudoCard,
} from '../../../automation/beefor/actions';
import { logger } from '../../logger';
import { ok, fail } from '../../../shared/result';
import { runBeeforAction, runBeeforActionWithReconnect } from '../../services/beeforActionRunner';
import { kudoDetailIdSchema, kudoSearchArgsSchema, sendKudoCardSchema } from '../schemas';
import { validate } from '../validate';

export function registerKudoHandlers(getWindow: () => BrowserWindow | null) {
  ipcMain.handle(IPC.ACTION_KUDO_COUNTS, async () => {
    const win = getWindow();
    try {
      const data = await runBeeforAction(win, (page) => doFetchKudoCounts(page));
      return ok(data);
    } catch (err) {
      logger.error('Kudo counts failed', err);
      return fail(err);
    }
  });

  ipcMain.handle(IPC.ACTION_KUDO_LISTS, async () => {
    const win = getWindow();
    try {
      const data = await runBeeforAction(win, (page) => doFetchKudoLists(page));
      return ok(data);
    } catch (err) {
      logger.error('Kudo lists failed', err);
      return fail(err);
    }
  });

  ipcMain.handle(IPC.ACTION_KUDO_DETAIL, async (_e, payload: unknown) => {
    const parsed = validate(kudoDetailIdSchema, payload);
    if (!parsed.ok) return parsed.result;
    const win = getWindow();
    try {
      const data = await runBeeforAction(win, (page) => doFetchKudoDetail(page, parsed.data));
      return ok(data);
    } catch (err) {
      logger.error('Kudo detail failed', err);
      return fail(err);
    }
  });

  ipcMain.handle(IPC.ACTION_SEARCH_KUDO_RECIPIENT, async (_e, type: unknown, query: unknown) => {
    const parsed = validate(kudoSearchArgsSchema, [type, query]);
    if (!parsed.ok) return parsed.result;
    const [pType, pQuery] = parsed.data;
    const win = getWindow();
    try {
      const results = await runBeeforAction(win, (page) =>
        doSearchKudoRecipient(page, pType, pQuery),
      );
      return ok(results);
    } catch (err) {
      logger.warn(
        `Search kudo recipient failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return fail(err);
    }
  });

  ipcMain.handle(IPC.ACTION_SEND_KUDO_CARD, async (_e, payload: unknown) => {
    const parsed = validate(sendKudoCardSchema, payload);
    if (!parsed.ok) return parsed.result;
    const win = getWindow();
    try {
      const result = await runBeeforActionWithReconnect(win, 'KudoCard', (page) =>
        doSendKudoCard(page, parsed.data),
      );
      return ok(result);
    } catch (err) {
      logger.error('Send KudoCard failed', err);
      return fail(err);
    }
  });
}

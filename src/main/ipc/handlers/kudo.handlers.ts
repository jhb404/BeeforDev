import type { BrowserWindow } from 'electron';
import { IPC } from '../../../shared/ipc/index';
import {
  doFetchKudoCounts,
  doFetchKudoDetail,
  doFetchKudoLists,
  doSearchKudoRecipient,
  doSendKudoCard,
} from '../../../automation/beefor/actions';
import { ok } from '../../../shared/result';
import { runBeeforAction, runBeeforActionWithReconnect } from '../../services/beeforActionRunner';
import { kudoDetailIdSchema, kudoSearchArgsSchema, sendKudoCardSchema } from '../schemas';
import { defineHandler } from '../defineHandler';

export function registerKudoHandlers(getWindow: () => BrowserWindow | null) {
  defineHandler({
    channel: IPC.ACTION_KUDO_COUNTS,
    errorMessage: 'Kudo counts failed',
    run: async () => {
      const win = getWindow();
      const data = await runBeeforAction(win, (page) => doFetchKudoCounts(page));
      return ok(data);
    },
  });

  defineHandler({
    channel: IPC.ACTION_KUDO_LISTS,
    errorMessage: 'Kudo lists failed',
    run: async () => {
      const win = getWindow();
      const data = await runBeeforAction(win, (page) => doFetchKudoLists(page));
      return ok(data);
    },
  });

  defineHandler({
    channel: IPC.ACTION_KUDO_DETAIL,
    schema: kudoDetailIdSchema,
    errorMessage: 'Kudo detail failed',
    run: async ({ data }) => {
      const win = getWindow();
      const detail = await runBeeforAction(win, (page) => doFetchKudoDetail(page, data));
      return ok(detail);
    },
  });

  defineHandler({
    channel: IPC.ACTION_SEARCH_KUDO_RECIPIENT,
    schema: kudoSearchArgsSchema,
    payload: (args) => args,
    errorMessage: 'Search kudo recipient failed',
    run: async ({ data }) => {
      const [type, query] = data;
      const win = getWindow();
      const results = await runBeeforAction(win, (page) =>
        doSearchKudoRecipient(page, type, query),
      );
      return ok(results);
    },
  });

  defineHandler({
    channel: IPC.ACTION_SEND_KUDO_CARD,
    schema: sendKudoCardSchema,
    errorMessage: 'Send KudoCard failed',
    run: async ({ data }) => {
      const win = getWindow();
      const result = await runBeeforActionWithReconnect(win, 'KudoCard', (page) =>
        doSendKudoCard(page, data),
      );
      return ok(result);
    },
  });
}

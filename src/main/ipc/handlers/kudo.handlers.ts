import { BrowserWindow, ipcMain } from 'electron';
import { IPC } from '../../../shared/ipc';
import type { SendKudoCardRequest } from '../../../shared/types';
import {
  doFetchKudoCounts,
  doFetchKudoDetail,
  doFetchKudoLists,
  doSearchKudoRecipient,
  doSendKudoCard,
} from '../../../automation/beefor/beeforActions';
import { logger } from '../../logger';
import { ok, fail } from '../../services/result';
import {
  runBeeforAction,
  runBeeforActionWithReconnect,
} from '../../services/beeforActionRunner';

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

  ipcMain.handle(IPC.ACTION_KUDO_DETAIL, async (_e, id: string) => {
    const win = getWindow();
    if (!id || typeof id !== 'string') return fail(new Error('id inválido.'));
    try {
      const data = await runBeeforAction(win, (page) =>
        doFetchKudoDetail(page, id),
      );
      return ok(data);
    } catch (err) {
      logger.error('Kudo detail failed', err);
      return fail(err);
    }
  });

  ipcMain.handle(
    IPC.ACTION_SEARCH_KUDO_RECIPIENT,
    async (_e, type: 'person' | 'team', query: string) => {
      const win = getWindow();
      if (type !== 'person' && type !== 'team') {
        return fail(new Error('Tipo inválido.'));
      }
      try {
        const results = await runBeeforAction(win, (page) =>
          doSearchKudoRecipient(page, type, query ?? ''),
        );
        return ok(results);
      } catch (err) {
        logger.warn(
          `Search kudo recipient failed: ${err instanceof Error ? err.message : String(err)}`,
        );
        return fail(err);
      }
    },
  );

  ipcMain.handle(
    IPC.ACTION_SEND_KUDO_CARD,
    async (_e, req: SendKudoCardRequest) => {
      const win = getWindow();
      if (!req || typeof req !== 'object') return fail(new Error('Payload inválido.'));
      if (!req.recipientName?.trim()) return fail(new Error('Informe o destinatário.'));
      if (!req.message?.trim()) return fail(new Error('Mensagem não pode ser vazia.'));
      if (req.recipientType !== 'person' && req.recipientType !== 'team') {
        return fail(new Error('Tipo de destinatário inválido.'));
      }
      try {
        const result = await runBeeforActionWithReconnect(
          win,
          'KudoCard',
          (page) => doSendKudoCard(page, req),
        );
        return ok(result);
      } catch (err) {
        logger.error('Send KudoCard failed', err);
        return fail(err);
      }
    },
  );
}

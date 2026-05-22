import type { BrowserWindow } from 'electron';
import { IPC } from '../../../shared/ipc/index';
import { ok } from '../../../shared/result';
import { listMinhasAtividades } from '../../services/beeforAtividadesService';
import { defineHandler } from '../defineHandler';

export function registerAtividadesHandlers(_getWindow: () => BrowserWindow | null) {
  defineHandler({
    channel: IPC.ACTION_FETCH_ATIVIDADES,
    errorMessage: 'Fetch atividades failed',
    run: async () => {
      // HTTP direto via sessão cacheada (sem Playwright).
      const data = await listMinhasAtividades();
      return ok(data);
    },
  });
}

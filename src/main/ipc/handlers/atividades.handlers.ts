import { ipcMain } from 'electron';
import type { BrowserWindow } from 'electron';
import { IPC } from '../../../shared/ipc';
import { ok, fail } from '../../services/result';
import { logger } from '../../logger';
import { getBeeforTokenCache, refreshBeeforTokenCache } from '../../beeforTokenCache';
import { BeeforClient } from '../../../automation/beefor/beeforClient';
import { withPageLock } from '../../../automation/beefor/pageLock';
import { ensureSessionForAction } from '../../sessionGuard';

const BEEFOR_API_BASE = 'https://apiteams.goobee.com.br/api';

async function getTokenEntry(win: BrowserWindow | null) {
  let entry = getBeeforTokenCache();
  if (entry) return entry;

  // Cache miss — pull from Playwright localStorage (no page lock needed for eval)
  await ensureSessionForAction(win);
  entry = await withPageLock(async () => {
    const page = await BeeforClient.instance().getPage();
    return refreshBeeforTokenCache(page);
  });
  return entry;
}

export function registerAtividadesHandlers(getWindow: () => BrowserWindow | null) {
  ipcMain.handle(IPC.ACTION_FETCH_ATIVIDADES, async () => {
    const win = getWindow();
    try {
      const entry = await getTokenEntry(win);
      if (!entry) return fail(new Error('Token Beefor não disponível. Conecte a sessão primeiro.'));

      // Pure Node fetch — no Playwright, no page lock, no navigation
      const url = `${BEEFOR_API_BASE}/Quadro/ListarMinhasTarefas/${entry.idPessoa}`;
      const res = await fetch(url, {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${entry.token}`,
        },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        return fail(new Error(`${res.status} ${txt.slice(0, 200)}`));
      }

      const data = await res.json();
      return ok(data);
    } catch (err) {
      logger.error('Fetch atividades failed', err);
      return fail(err);
    }
  });
}

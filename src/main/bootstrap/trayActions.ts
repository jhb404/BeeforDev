import type { BrowserWindow } from 'electron';
import {
  doAutoLancamento,
  doGetCurrentMood,
  doSelectMood,
} from '../../automation/beefor/actions';
import type { Mood } from '../../shared/types/index';
import { IPC } from '../../shared/ipc/index';
import { logger } from '../logger';
import { runBeeforActionWithReconnect } from '../services/beeforActionRunner';
import { notifyWindows } from './notifications';

export async function runAutoLancamentoFromTray(win: BrowserWindow | null): Promise<void> {
  const title = 'Auto lançamento';
  try {
    notifyWindows('Beefor U', 'Auto lançamento iniciado. Vou avisar quando terminar.');
    await runBeeforActionWithReconnect(win, title, (page) => doAutoLancamento(page));
    notifyWindows('Beefor U', 'Auto lançamento concluído. Calendário será atualizado.');
    win?.webContents.send(IPC.EVT_NOTIFY, {
      title: 'sync:autoLancamento',
      body: 'ok',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`${title} via tray falhou`, err);
    notifyWindows('Beefor U', `Auto lançamento falhou: ${msg}`);
    win?.webContents.send(IPC.EVT_NOTIFY, {
      title: 'sync:autoLancamento',
      body: 'failed',
    });
  }
}

export async function runMoodFromTray(win: BrowserWindow | null, mood: Mood): Promise<void> {
  const title = 'Escolher mood';
  try {
    const changed = await runBeeforActionWithReconnect(win, `${title} (${mood})`, async (page) => {
      const before = await doGetCurrentMood(page);
      await doSelectMood(page, mood);
      const after = await doGetCurrentMood(page);
      return before !== after && after === mood;
    });
    if (changed) notifyWindows('Beefor U', `Mood aplicado: ${mood}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Mood via tray falhou (${mood})`, err);
    notifyWindows('Beefor U', `${title} falhou: ${msg}`);
  }
}

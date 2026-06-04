import type { BrowserWindow } from 'electron';
import type { Mood } from '../../shared/types/index';
import { IPC } from '../../shared/ipc/index';
import { logger } from '../logger';
import { autoLancarApontamentos } from '../services/beeforTimesheetService';
import { addMood, getCurrentMood } from '../services/beeforMoodService';
import { notifyWindows } from './notifications';

export async function runAutoLancamentoFromTray(win: BrowserWindow | null): Promise<void> {
  const title = 'Auto lançamento';
  try {
    notifyWindows('Beefor U', 'Auto lançamento iniciado. Vou avisar quando terminar.');
    await autoLancarApontamentos();
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
  void win;
  const title = 'Escolher mood';
  try {
    const before = await getCurrentMood();
    await addMood(mood);
    const after = await getCurrentMood();
    const changed = before.mood !== after.mood && after.mood === mood;
    if (changed) notifyWindows('Beefor U', `Mood aplicado: ${mood}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Mood via tray falhou (${mood})`, err);
    notifyWindows('Beefor U', `${title} falhou: ${msg}`);
  }
}

import { BrowserWindow, ipcMain } from 'electron';
import { IPC } from '../../../shared/ipc';
import { doFetchTeamMembers } from '../../../automation/beefor/beeforActions';
import { logger } from '../../logger';
import { ok, fail, withTimeout } from '../../services/result';
import { runBeeforAction } from '../../services/beeforActionRunner';

export function registerTeamHandlers(getWindow: () => BrowserWindow | null) {
  ipcMain.handle(IPC.ACTION_FETCH_TEAM_MEMBERS, async () => {
    const win = getWindow();
    try {
      const data = await withTimeout(
        runBeeforAction(win, (page) => doFetchTeamMembers(page)),
        45_000,
        'Fetch team',
      );
      return ok(data);
    } catch (err) {
      logger.error('Fetch team members failed', err);
      return fail(err);
    }
  });
}

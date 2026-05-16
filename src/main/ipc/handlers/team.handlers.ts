import type { BrowserWindow } from 'electron';
import { IPC } from '../../../shared/ipc/index';
import { doFetchTeamMembers } from '../../../automation/beefor/actions';
import { ok, withTimeout } from '../../../shared/result';
import { runBeeforAction } from '../../services/beeforActionRunner';
import { defineHandler } from '../defineHandler';

export function registerTeamHandlers(getWindow: () => BrowserWindow | null) {
  defineHandler({
    channel: IPC.ACTION_FETCH_TEAM_MEMBERS,
    errorMessage: 'Fetch team members failed',
    run: async () => {
      const win = getWindow();
      const data = await withTimeout(
        runBeeforAction(win, (page) => doFetchTeamMembers(page)),
        45_000,
        'Fetch team',
      );
      return ok(data);
    },
  });
}

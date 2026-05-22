import type { BrowserWindow } from 'electron';
import { IPC } from '../../../shared/ipc/index';
import { ok } from '../../../shared/result';
import { fetchTeamMembers } from '../../services/beeforTeamService';
import { defineHandler } from '../defineHandler';

export function registerTeamHandlers(_getWindow: () => BrowserWindow | null) {
  defineHandler({
    channel: IPC.ACTION_FETCH_TEAM_MEMBERS,
    errorMessage: 'Fetch team members failed',
    run: async () => ok(await fetchTeamMembers()),
  });
}

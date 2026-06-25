import type { BrowserWindow } from 'electron';
import { z } from 'zod';
import { IPC } from '../../../shared/ipc/index';
import { ok } from '../../../shared/result';
import { fetchTeamMembers } from '../../services/beeforTeamService';
import { defineHandler } from '../defineHandler';

const teamFilterSchema = z
  .object({
    idTime: z.string().max(64).optional(),
    idGrupo: z.string().max(64).optional(),
  })
  .optional();

export function registerTeamHandlers(_getWindow: () => BrowserWindow | null) {
  defineHandler({
    channel: IPC.ACTION_FETCH_TEAM_MEMBERS,
    schema: teamFilterSchema,
    errorMessage: 'Fetch team members failed',
    run: async ({ data }) =>
      ok(await fetchTeamMembers({ idTime: data?.idTime, idGrupo: data?.idGrupo })),
  });
}

import type { ActionResult, TeamMember } from '@shared/types/index';
import type { BeeforApi } from '../../../main/preload';

export function createTeamClient(api: BeeforApi) {
  return {
    fetchMembers: (filter?: {
      idTime?: string;
      idGrupo?: string;
    }): Promise<ActionResult<TeamMember[]>> => api.fetchTeamMembers(filter),
  };
}

export const teamClient = createTeamClient(window.beefor);
export type TeamClient = ReturnType<typeof createTeamClient>;

import type { ActionResult, TeamMember } from '@shared/types';
import type { BeeforApi } from '../../../main/preload';

export function createTeamClient(api: BeeforApi) {
  return {
    fetchMembers: (): Promise<ActionResult<TeamMember[]>> => api.fetchTeamMembers(),
  };
}

export const teamClient = createTeamClient(window.beefor);
export type TeamClient = ReturnType<typeof createTeamClient>;

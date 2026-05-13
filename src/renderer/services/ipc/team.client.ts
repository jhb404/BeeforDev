import type { ActionResult, TeamMember } from '@shared/types';

export const teamClient = {
  fetchMembers: (): Promise<ActionResult<TeamMember[]>> =>
    window.beefor.fetchTeamMembers(),
};

import { useEffect } from 'react';
import { fetchTeamMembers } from '../../services/teamsService';
import { loadMembersCache, saveMembersCache } from '../../utils/teamCache';
import { useIpc } from '../../services/ipc';

const STALE_MS = 30 * 60 * 1000;

export function useTeamPrefetch(startupComplete: boolean, sessionReady: boolean): void {
  const { team: teamClient } = useIpc();
  useEffect(() => {
    if (!startupComplete || !sessionReady) return;
    const cached = loadMembersCache();
    const fresh =
      cached && cached.updatedAt
        ? Date.now() - new Date(cached.updatedAt).getTime() < STALE_MS
        : false;
    if (fresh) return;
    const timer = window.setTimeout(() => {
      void fetchTeamMembers(teamClient)
        .then(saveMembersCache)
        .catch(() => undefined);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [startupComplete, sessionReady, teamClient]);
}

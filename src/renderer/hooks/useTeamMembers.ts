import { useCallback, useEffect, useState } from 'react';
import type { TeamMember } from '@shared/types/index';
import { fetchTeamMembers } from '../services/teamsService';
import { useIpc } from '../services/ipc';
import {
  loadBirthdayCache,
  loadMembersCache,
  saveBirthdayCache,
  saveMembersCache,
  type TeamBirthdayCache,
} from '../utils/teamCache';
import {
  CONTEXT_CHANGED_EVENT,
  contextCacheKey,
  contextFilter,
  readSelection,
  type Selection,
} from '../utils/teamContext';

interface UseTeamMembersResult {
  members: TeamMember[];
  birthdays: TeamBirthdayCache;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: string | null;
  fromCache: boolean;
  refresh: () => Promise<void>;
  setBirthdays: (next: TeamBirthdayCache) => void;
}

export function useTeamMembers(active: boolean): UseTeamMembersResult {
  const { team: teamClient } = useIpc();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [birthdays, setBirthdaysState] = useState<TeamBirthdayCache>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  // contexto (org/time/grupo) escolhido no OrgSwitcher — define quais pessoas buscar
  const [selection, setSelection] = useState<Selection>(() => readSelection());

  useEffect(() => {
    setBirthdaysState(loadBirthdayCache());
  }, []);

  // OrgSwitcher troca time/grupo sem reload → reage ao evento e re-busca
  useEffect(() => {
    const onContext = () => setSelection(readSelection());
    window.addEventListener(CONTEXT_CHANGED_EVENT, onContext);
    return () => window.removeEventListener(CONTEXT_CHANGED_EVENT, onContext);
  }, []);

  const setBirthdays = useCallback((next: TeamBirthdayCache) => {
    setBirthdaysState(next);
    saveBirthdayCache(next);
  }, []);

  const cacheKey = contextCacheKey(selection);

  const load = useCallback(
    async (background: boolean) => {
      if (background) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const list = await fetchTeamMembers(teamClient, contextFilter(selection));
        setMembers(list);
        saveMembersCache(list, cacheKey);
        setLastUpdated(new Date().toISOString());
        setFromCache(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        if (background) setRefreshing(false);
        else setLoading(false);
      }
    },
    [teamClient, selection, cacheKey],
  );

  useEffect(() => {
    if (!active) return;
    const cached = loadMembersCache(cacheKey);
    if (cached && cached.members.length > 0) {
      setMembers(cached.members);
      setLastUpdated(cached.updatedAt);
      setFromCache(true);
      void load(true);
    } else {
      // contexto novo sem cache → limpa a lista pra não exibir o time anterior
      setMembers([]);
      setLastUpdated(null);
      setFromCache(false);
      void load(false);
    }
  }, [active, load, cacheKey]);

  const refresh = useCallback(async () => {
    await load(members.length > 0);
  }, [load, members.length]);

  return {
    members,
    birthdays,
    loading,
    refreshing,
    error,
    lastUpdated,
    fromCache,
    refresh,
    setBirthdays,
  };
}

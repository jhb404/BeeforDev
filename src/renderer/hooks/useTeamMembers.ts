import { useCallback, useEffect, useState } from 'react';
import type { TeamMember } from '@shared/types/index';
import { fetchTeamMembers } from '../services/teamsService';
import {
  loadBirthdayCache,
  loadMembersCache,
  saveBirthdayCache,
  saveMembersCache,
  type TeamBirthdayCache,
} from '../utils/teamCache';

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
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [birthdays, setBirthdaysState] = useState<TeamBirthdayCache>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    setBirthdaysState(loadBirthdayCache());
  }, []);

  const setBirthdays = useCallback((next: TeamBirthdayCache) => {
    setBirthdaysState(next);
    saveBirthdayCache(next);
  }, []);

  const load = useCallback(async (background: boolean) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const list = await fetchTeamMembers();
      setMembers(list);
      saveMembersCache(list);
      setLastUpdated(new Date().toISOString());
      setFromCache(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      if (background) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const cached = loadMembersCache();
    if (cached && cached.members.length > 0) {
      setMembers(cached.members);
      setLastUpdated(cached.updatedAt);
      setFromCache(true);
      void load(true);
    } else {
      void load(false);
    }
  }, [active, load]);

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

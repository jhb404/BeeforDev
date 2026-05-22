import { useEffect, useState } from 'react';

/**
 * Streak real do usuário via /Home/MoodStreakOrganizacao (cache disco SWR no main).
 * Retorna streakUsuarioAtual. Cache quente = instantâneo.
 */
export function useRealMoodStreak(): { streak: number; loading: boolean } {
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!window.beeforHttp?.mood?.streakOrg) return;
        const res = await window.beeforHttp.mood.streakOrg(undefined, undefined, 30);
        if (cancelled || !res.ok) return;
        const data = res.data as { streakUsuarioAtual?: number } | undefined;
        setStreak(Number(data?.streakUsuarioAtual ?? 0));
      } catch {
        // mantém 0
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { streak, loading };
}

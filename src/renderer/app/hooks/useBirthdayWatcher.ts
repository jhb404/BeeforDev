import { useEffect, useRef, useState } from 'react';
import {
  birthdayKey,
  loadBirthdayCache,
  loadMembersCache,
} from '../../utils/teamCache';
import { isBirthdayToday } from '../../utils/dates';
import { playUiBirthdayAlert } from '../../utils/alarm';

interface BirthdayState {
  partyCount: number;          // count shown on team button visual
  partyBadge: number;          // count shown on team button badge
  pendingCount: number;        // detected today but waiting for startup
  dismissBadge: () => void;
}

/**
 * Recomputes today's birthdays from cached team members + birthday data.
 * Birthday sound + visual appear together AFTER startupComplete, with a 5s grace
 * period so they don't compete with splash animation. Plays sound only when
 * `uiSoundsEnabled` is true and exactly once per session.
 */
export function useBirthdayWatcher(
  startupComplete: boolean,
  uiSoundsEnabled: boolean,
  rerenderTrigger?: unknown,
): BirthdayState {
  const [partyCount, setPartyCount] = useState(0);
  const [partyBadge, setPartyBadge] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const alertsInjected = useRef(false);
  const soundPlayed = useRef(false);

  useEffect(() => {
    const recompute = () => {
      const cache = loadMembersCache();
      const bdays = loadBirthdayCache();
      if (!cache) {
        setPartyCount(0);
        setPendingCount(0);
        return;
      }
      const todayBirthdays: typeof cache.members = [];
      for (const m of cache.members) {
        const b = bdays[birthdayKey(m)]?.birthday;
        if (isBirthdayToday(b)) todayBirthdays.push(m);
      }
      if (todayBirthdays.length > 0 && !alertsInjected.current) {
        alertsInjected.current = true;
        setPendingCount(todayBirthdays.length);
      }
    };
    recompute();
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === 'beefor-team-members' || e.key === 'beefor-team-birthdays') recompute();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [rerenderTrigger]);

  useEffect(() => {
    if (soundPlayed.current) return;
    if (!startupComplete || pendingCount <= 0) return;
    const timer = window.setTimeout(() => {
      setPartyCount(pendingCount);
      setPartyBadge(pendingCount);
      soundPlayed.current = true;
      if (uiSoundsEnabled) void playUiBirthdayAlert();
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [pendingCount, uiSoundsEnabled, startupComplete]);

  return {
    partyCount,
    partyBadge,
    pendingCount,
    dismissBadge: () => setPartyBadge(0),
  };
}

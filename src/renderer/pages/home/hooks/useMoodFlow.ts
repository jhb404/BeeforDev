import { useCallback, useEffect, useState } from 'react';
import { MOODS, type Mood } from '@shared/types/index';
import type { MoodClient } from '../../../services/ipc/mood.client';

interface UseMoodFlowOptions {
  ready: boolean;
  moodClient: MoodClient;
  wrap: (keyOrFn: any, maybeFn?: () => Promise<void>) => Promise<void>;
  showToast: (toast: { kind: 'ok' | 'err'; title?: string; msg: string }) => void;
  onMoodChanged?: (mood: string | null) => void;
}

export function useMoodFlow({
  ready,
  moodClient,
  wrap,
  showToast,
  onMoodChanged,
}: UseMoodFlowOptions) {
  const [currentMood, setCurrentMood] = useState<Mood | null>(null);
  const [loadingMood, setLoadingMood] = useState(false);
  const [moodLoaded, setMoodLoaded] = useState(false);

  const notifyMoodChanged = useCallback(
    (mood: string | null) => onMoodChanged?.(mood),
    [onMoodChanged],
  );

  const refreshMood = useCallback(async () => {
    setLoadingMood(true);
    try {
      const res = await moodClient.getCurrent();
      if (res.ok) {
        const m = res.data ?? null;
        const matched = (MOODS as readonly string[]).includes(m ?? '') ? (m as Mood) : null;
        setCurrentMood(matched);
        notifyMoodChanged(matched);
      }
    } finally {
      setLoadingMood(false);
      setMoodLoaded(true);
    }
  }, [moodClient, notifyMoodChanged]);

  useEffect(() => {
    if (!ready) return;
    const handleFocus = () => void refreshMood();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refreshMood();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [ready, refreshMood]);

  const selectMood = useCallback(
    async (m: Mood) => {
      if (currentMood === m) return;
      const previous = currentMood;
      setCurrentMood(m);
      await wrap('mood', async () => {
        const res = await moodClient.select(m);
        if (!res.ok) {
          setCurrentMood(previous);
          notifyMoodChanged(previous);
          showToast({
            kind: 'err',
            title: 'Mood não salvo',
            msg: (res.ok ? '' : res.error) || 'falhou',
          });
        } else {
          showToast({ kind: 'ok', title: 'Mood salvo', msg: m });
          notifyMoodChanged(m);
          void refreshMood();
        }
      });
    },
    [currentMood, moodClient, notifyMoodChanged, refreshMood, showToast, wrap],
  );

  return {
    currentMood,
    loadingMood,
    moodLoaded,
    refreshMood,
    selectMood,
  };
}

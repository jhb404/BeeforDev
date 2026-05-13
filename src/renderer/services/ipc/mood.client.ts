import type { ActionResult, Mood } from '@shared/types';

export const moodClient = {
  select: (mood: Mood): Promise<ActionResult> => window.beefor.selectMood(mood),
  getCurrent: (): Promise<ActionResult<string | null>> =>
    window.beefor.getCurrentMood(),
};

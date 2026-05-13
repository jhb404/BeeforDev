import type { ActionResult, Mood } from '@shared/types';
import type { BeeforApi } from '../../../main/preload';

export function createMoodClient(api: BeeforApi) {
  return {
    select: (mood: Mood): Promise<ActionResult> => api.selectMood(mood),
    getCurrent: (): Promise<ActionResult<string | null>> => api.getCurrentMood(),
  };
}

export const moodClient = createMoodClient(window.beefor);
export type MoodClient = ReturnType<typeof createMoodClient>;

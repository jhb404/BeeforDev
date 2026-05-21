import type { ActionResult, Mood } from '@shared/types/index';
import type { BeeforHttpApi } from '../../../main/preload';

function requireHttp(http?: BeeforHttpApi): BeeforHttpApi {
  if (!http) throw new Error('API HTTP indisponível — reinicie o app.');
  return http;
}

export function createMoodClient(http?: BeeforHttpApi) {
  return {
    select: async (mood: Mood): Promise<ActionResult> => {
      return requireHttp(http).mood.add(mood);
    },
    getCurrent: async (): Promise<ActionResult<string | null>> => {
      const res = await requireHttp(http).mood.get();
      if (!res.ok) return res as ActionResult<string | null>;
      const data = res.data as unknown as { mood?: string | null } | null | undefined;
      return {
        ok: true as const,
        data: data?.mood ?? null,
      } as ActionResult<string | null>;
    },
  };
}

export const moodClient = createMoodClient(
  typeof window !== 'undefined' ? window.beeforHttp : undefined,
);
export type MoodClient = ReturnType<typeof createMoodClient>;

import { useEffect } from 'react';
import { playAlarmByKind } from '../../utils/alarm';

type AlarmKind = 'mood' | 'lunch' | 'punch' | 'kudocard' | 'default';

function classifyAlarm(title: string): AlarmKind {
  if (title.includes('Mood')) return 'mood';
  if (title.includes('almoço') || title.includes('Almoço')) return 'lunch';
  if (title.includes('Ponto')) return 'punch';
  if (title.includes('Kudocard') || title.includes('kudocard')) return 'kudocard';
  return 'default';
}

/**
 * Listens for `evt:playAlarm` from main and plays the matching alarm sound.
 */
export function useAlarmRouter(): void {
  useEffect(() => {
    const off = window.beefor.onPlayAlarm((info) => {
      void playAlarmByKind(classifyAlarm(info.title));
    });
    return off;
  }, []);
}

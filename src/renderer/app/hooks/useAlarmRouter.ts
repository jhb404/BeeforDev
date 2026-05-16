import { useEffect } from 'react';
import { playAlarmByKind } from '../../utils/alarm';
import { useIpc } from '../../services/ipc';

type AlarmKind = 'mood' | 'lunch' | 'punch' | 'kudocard' | 'default';

function classifyAlarm(title: string): AlarmKind {
  // TODO: remove title fallback after one release with `evt:playAlarm.kind` in main.
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
  const { system: systemClient } = useIpc();
  useEffect(() => {
    const off = systemClient.onPlayAlarm((info) => {
      void playAlarmByKind(info.kind ?? classifyAlarm(info.title));
    });
    return off;
  }, [systemClient]);
}

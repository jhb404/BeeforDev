import { useEffect } from 'react';
import { playAlarmByKind } from '../../utils/alarm';
import { useIpc } from '../../services/ipc';

type AlarmKind = 'mood' | 'lunch' | 'punch' | 'kudocard' | 'pj' | 'default';

function classifyAlarm(title: string): AlarmKind {
  // TODO: remove title fallback after one release with `evt:playAlarm.kind` in main.
  // Diário e mensal compartilham "Lançamento de horas" no título: o diário sempre
  // traz "— <horário>", então ele é testado primeiro.
  if (title.includes('Mood')) return 'mood';
  if (title.includes('Intervalo') || title.includes('intervalo')) return 'lunch';
  if (title.includes('Lançamento de horas —')) return 'punch';
  if (title.includes('Lançamento de horas')) return 'pj';
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

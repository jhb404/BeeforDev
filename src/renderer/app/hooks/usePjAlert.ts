import { useEffect, useState } from 'react';
import { useIpc } from '../../services/ipc';

interface PjAlertState {
  open: boolean;
  title: string;
  body: string;
  close: () => void;
}

/**
 * Abre uma modal de alerta in-app quando o alarme PJ ("Ajustar Pontos") dispara.
 * Escuta `evt:playAlarm` filtrando pela kind `pj` (o som já é tocado por useAlarmRouter).
 */
export function usePjAlert(): PjAlertState {
  const { system: systemClient } = useIpc();
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState({ title: '🧾 Ajustar Pontos (PJ)', body: '' });

  useEffect(() => {
    const off = systemClient.onPlayAlarm((a) => {
      const isPj = a.kind === 'pj' || a.title.includes('PJ') || a.title.includes('Ajustar Pontos');
      if (!isPj) return;
      setInfo({ title: a.title, body: a.body });
      setOpen(true);
    });
    return off;
  }, [systemClient]);

  return { open, title: info.title, body: info.body, close: () => setOpen(false) };
}

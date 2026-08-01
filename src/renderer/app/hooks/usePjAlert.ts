import { useEffect, useState } from 'react';
import { useIpc } from '../../services/ipc';

interface PjAlertState {
  open: boolean;
  title: string;
  body: string;
  close: () => void;
}

/**
 * Abre uma modal in-app quando o lembrete MENSAL de lançamento de horas dispara.
 * Escuta `evt:playAlarm` filtrando pela kind `pj` (o som já é tocado por useAlarmRouter).
 */
export function usePjAlert(): PjAlertState {
  const { system: systemClient } = useIpc();
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState({ title: '🧾 Lançamento de horas', body: '' });

  useEffect(() => {
    const off = systemClient.onPlayAlarm((a) => {
      // `kind` é a fonte de verdade: o alerta diário também tem "Lançamento de horas"
      // no título, e só o mensal (🧾) abre esta modal.
      const isMensal = a.kind === 'pj' || (!a.kind && a.title.startsWith('🧾'));
      if (!isMensal) return;
      setInfo({ title: a.title, body: a.body });
      setOpen(true);
    });
    return off;
  }, [systemClient]);

  return { open, title: info.title, body: info.body, close: () => setOpen(false) };
}

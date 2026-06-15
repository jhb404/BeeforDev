import { useCallback, useEffect, useState } from 'react';
import { getError } from '@shared/result';
import { useIpc } from '../../../services/ipc';
import { useToast } from '../../../app/providers/ToastProvider';

/** Estado de elevação (admin/UAC) — usado pra mostrar banner em Windows. */
export function useAdminElevation() {
  const { system: systemClient } = useIpc();
  const showToast = useToast();
  const [admin, setAdmin] = useState<{ elevated: boolean; platform: string } | null>(null);

  const refresh = useCallback(
    () => void systemClient.getAdminStatus().then(setAdmin),
    [systemClient],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const elevateNow = async () => {
    const res = await systemClient.relaunchAsAdmin();
    if (!res.ok) showToast({ kind: 'err', msg: `Falha ao elevar: ${getError(res)}` });
  };

  return { admin, refresh, elevateNow };
}

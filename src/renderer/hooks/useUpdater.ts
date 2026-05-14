import { useEffect, useState } from 'react';
import { systemClient } from '../services/ipc';

export type UpdateState =
  | { status: 'idle' }
  | { status: 'available'; version: string }
  | { status: 'ready'; version: string };

export function useUpdater() {
  const [state, setState] = useState<UpdateState>({ status: 'idle' });

  useEffect(() => {
    const offAvail = systemClient.onUpdateAvailable(({ version }) =>
      setState({ status: 'available', version }),
    );
    const offReady = systemClient.onUpdateDownloaded(({ version }) =>
      setState({ status: 'ready', version }),
    );
    return () => {
      offAvail();
      offReady();
    };
  }, []);

  const install = () => void systemClient.quitAndInstallUpdate();

  return { state, install };
}

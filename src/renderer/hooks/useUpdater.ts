import { useEffect, useState } from 'react';
import { systemClient } from '../services/ipc';

export type UpdateState =
  | { status: 'idle' }
  | { status: 'available'; version: string }
  | { status: 'ready'; version: string }
  | { status: 'installing'; version: string };

export function useUpdater() {
  const [state, setState] = useState<UpdateState>({ status: 'idle' });

  useEffect(() => {
    const offAvail = systemClient.onUpdateAvailable(({ version }) =>
      setState((prev) => (prev.status === 'idle' ? { status: 'available', version } : prev)),
    );
    const offReady = systemClient.onUpdateDownloaded(({ version }) =>
      setState({ status: 'ready', version }),
    );
    return () => {
      offAvail();
      offReady();
    };
  }, []);

  const install = () => {
    setState((prev) => {
      if (prev.status !== 'ready') return prev;
      void systemClient.quitAndInstallUpdate();
      return { status: 'installing', version: prev.version };
    });
  };

  return { state, install };
}

import { useEffect } from 'react';
import { useIpc } from '../../services/ipc';

interface UseTrayListenersOptions {
  onLunchTimer: () => void;
  onOpenKudo: () => void;
  onOpenCoins: () => void;
}

export function useTrayListeners({
  onLunchTimer,
  onOpenKudo,
  onOpenCoins,
}: UseTrayListenersOptions): void {
  const { system: systemClient } = useIpc();

  useEffect(() => {
    const offLunch = systemClient.onTrayLunchTimer(onLunchTimer);
    const offKudo = systemClient.onTrayOpenKudo(onOpenKudo);
    const offCoins = systemClient.onTrayOpenCoins(onOpenCoins);
    return () => {
      offLunch();
      offKudo();
      offCoins();
    };
  }, [onLunchTimer, onOpenCoins, onOpenKudo, systemClient]);
}

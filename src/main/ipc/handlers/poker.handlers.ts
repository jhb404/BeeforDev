import { IPC } from '../../../shared/ipc/index';
import { ok } from '../../../shared/result';
import { defineHandler } from '../defineHandler';
import { getLocalIp, getPokerPort, startPokerServer } from '../../services/pokerServer';
import { startTunnel, stopTunnel } from '../../services/tunnelManager';

export function registerPokerHandlers(): void {
  startPokerServer();

  defineHandler({
    channel: IPC.POKER_GET_PORT,
    errorMessage: 'Get poker port failed',
    run: () => getPokerPort(),
  });

  defineHandler({
    channel: IPC.POKER_GET_LOCAL_IP,
    errorMessage: 'Get poker local IP failed',
    run: () => getLocalIp(),
  });

  defineHandler({
    channel: IPC.POKER_START_TUNNEL,
    errorMessage: 'Start poker tunnel failed',
    run: async () => {
      const url = await startTunnel();
      return ok(url);
    },
  });

  defineHandler({
    channel: IPC.POKER_STOP_TUNNEL,
    errorMessage: 'Stop poker tunnel failed',
    run: () => {
      stopTunnel();
      return ok();
    },
  });
}

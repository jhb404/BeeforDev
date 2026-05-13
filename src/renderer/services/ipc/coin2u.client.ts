import type {
  ActionResult,
  Coin2uBuyItemRequest,
  Coin2uCredentials,
  Coin2uDashboard,
  Coin2uLog,
  Coin2uShop,
  Coin2uTransferRequest,
} from '@shared/types';
import type { BeeforApi } from '../../../main/preload';

export function createCoin2uClient(api: BeeforApi) {
  return {
    saveCreds: (payload: { email: string; password: string }): Promise<ActionResult> =>
      api.saveCoin2uCreds(payload),
    getCreds: (): Promise<Coin2uCredentials | null> => api.getCoin2uCreds(),
    clearCreds: (): Promise<ActionResult> => api.clearCoin2uCreds(),
    getDashboard: (): Promise<ActionResult<Coin2uDashboard>> => api.getCoin2uDashboard(),
    getLog: (): Promise<ActionResult<Coin2uLog>> => api.getCoin2uLog(),
    getShop: (): Promise<ActionResult<Coin2uShop>> => api.getCoin2uShop(),
    buyItem: (payload: Coin2uBuyItemRequest): Promise<ActionResult<boolean>> =>
      api.buyCoin2uItem(payload),
    transfer: (payload: Coin2uTransferRequest): Promise<ActionResult<boolean>> =>
      api.transferCoin2uCoins(payload),
    verify: (): Promise<ActionResult<{ userId: number; email: string }>> => api.verifyCoin2u(),
  };
}

export const coin2uClient = createCoin2uClient(window.beefor);
export type Coin2uClient = ReturnType<typeof createCoin2uClient>;

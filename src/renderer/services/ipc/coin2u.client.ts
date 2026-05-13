import type {
  ActionResult,
  Coin2uBuyItemRequest,
  Coin2uCredentials,
  Coin2uDashboard,
  Coin2uLog,
  Coin2uShop,
  Coin2uTransferRequest,
} from '@shared/types';

export const coin2uClient = {
  saveCreds: (payload: { email: string; password: string }): Promise<ActionResult> =>
    window.beefor.saveCoin2uCreds(payload),
  getCreds: (): Promise<Coin2uCredentials | null> => window.beefor.getCoin2uCreds(),
  clearCreds: (): Promise<ActionResult> => window.beefor.clearCoin2uCreds(),
  getDashboard: (): Promise<ActionResult<Coin2uDashboard>> =>
    window.beefor.getCoin2uDashboard(),
  getLog: (): Promise<ActionResult<Coin2uLog>> => window.beefor.getCoin2uLog(),
  getShop: (): Promise<ActionResult<Coin2uShop>> => window.beefor.getCoin2uShop(),
  buyItem: (payload: Coin2uBuyItemRequest): Promise<ActionResult<boolean>> =>
    window.beefor.buyCoin2uItem(payload),
  transfer: (payload: Coin2uTransferRequest): Promise<ActionResult<boolean>> =>
    window.beefor.transferCoin2uCoins(payload),
  verify: (): Promise<ActionResult<{ userId: number; email: string }>> =>
    window.beefor.verifyCoin2u(),
};

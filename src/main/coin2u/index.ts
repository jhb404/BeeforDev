import keytar from 'keytar';
import { KEYTAR_ACCOUNT_COIN2U_EMAIL, KEYTAR_SERVICE } from '../../shared/constants';
import type { Coin2uCredentials } from '../../shared/types';
import { coin2uAuth } from './auth';

export { coin2uAuth } from './auth';
export {
  clearCoin2uCredentials,
  coin2uVerifyLogin,
  getCoin2uCredentials,
  onCoin2uLogin,
  saveCoin2uCredentials,
} from './auth';
export { coin2uAuthedGet, coin2uAuthedPost } from './http';
export {
  buyCoin2uItem,
  fetchCoin2uOrgs,
  getCoin2uDashboard,
  getCoin2uLog,
  getCoin2uShop,
  transferCoin2uCoins,
} from './endpoints';

export async function initCoin2u(): Promise<void> {
  await coin2uAuth.loadFromDisk();
}

export function getCoin2uUserId(): number | null {
  return coin2uAuth.getUserId();
}

export function getCoin2uTokenApi(): string | null {
  return coin2uAuth.getTokenApi();
}

export function getCoin2uInfo(): Record<string, unknown> | null {
  return coin2uAuth.getInfo();
}

/**
 * Returns email + the auto-captured userId (if any). userId is no longer
 * required from the user — extracted from login response.
 */
export async function getMaskedCoin2uCreds(
  fallbackUserId: number | undefined,
): Promise<Coin2uCredentials | null> {
  await coin2uAuth.loadFromDisk();
  const email = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_COIN2U_EMAIL);
  if (!email) return null;
  const userId = coin2uAuth.getUserId() ?? fallbackUserId;
  return { email, userId };
}

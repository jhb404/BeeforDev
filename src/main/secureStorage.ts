import keytar from 'keytar';
import { KEYTAR_ACCOUNT_EMAIL, KEYTAR_ACCOUNT_PASSWORD, KEYTAR_SERVICE } from '../shared/constants';
import type { Credentials } from '../shared/types';
import { logger } from './logger';

export async function saveCredentials(creds: Credentials): Promise<void> {
  await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_EMAIL, creds.email);
  await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_PASSWORD, creds.password);
  logger.info('Credentials saved to OS keychain');
}

export async function getCredentials(): Promise<Credentials | null> {
  const email = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_EMAIL);
  const password = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_PASSWORD);
  if (!email || !password) return null;
  return { email, password };
}

export async function clearCredentials(): Promise<void> {
  await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_EMAIL);
  await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_PASSWORD);
  logger.info('Credentials cleared');
}

import { IPC } from '../../../shared/ipc/index';
import { clearCredentials, getCredentials, saveCredentials } from '../../secureStorage';
import { ok } from '../../../shared/result';
import { credentialsSchema } from '../schemas';
import { defineHandler } from '../defineHandler';
import { getCurrentStatus } from '../../statusBus';

export function registerCredentialsHandlers() {
  defineHandler({
    channel: IPC.CREDS_SAVE,
    schema: credentialsSchema,
    errorMessage: 'Save credentials failed',
    run: async ({ data }) => {
      await saveCredentials(data);
      return ok();
    },
  });

  defineHandler({
    channel: IPC.CREDS_GET,
    errorMessage: 'Get credentials failed',
    run: async () => {
      const c = await getCredentials();
      // `connected` espelha o Coin2u: mostra status na tela de Segurança.
      // Sessão viva = status 'connected' no statusBus.
      return c ? { email: c.email, connected: getCurrentStatus() === 'connected' } : null;
    },
  });

  defineHandler({
    channel: IPC.CREDS_CLEAR,
    errorMessage: 'Clear credentials failed',
    run: async () => {
      await clearCredentials();
      return ok();
    },
  });
}

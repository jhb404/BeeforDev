import type { BrowserWindow } from 'electron';
import { IPC } from '../../../shared/ipc/index';
import { emitStatus, getCurrentStatus } from '../../statusBus';
import { getCredentials, saveGoogleToken, clearGoogleToken } from '../../secureStorage';
import { clearSession } from '../../sessionStore';
import { ok } from '../../../shared/result';
import { defineHandler } from '../defineHandler';
import {
  loginHttp,
  applyGoogleSession,
  clearCachedSession,
  clearCredentials as clearHttpCreds,
  setGoogleToken,
  getValidSession,
  BeeforAuthError,
} from '../../services/beeforHttpClient';
import { signInWithGoogle } from '../../services/googleAuth';
import { logger } from '../../logger';

export function registerSessionHandlers(getWindow: () => BrowserWindow | null) {
  defineHandler({
    channel: IPC.SESSION_STATUS,
    errorMessage: 'Session status failed',
    run: () => getCurrentStatus(),
  });

  defineHandler({
    channel: IPC.SESSION_LOGIN,
    errorMessage: 'Login failed',
    onError: () => emitStatus(getWindow(), 'error'),
    run: async () => {
      const win = getWindow();
      emitStatus(win, 'loading');
      const creds = await getCredentials();
      if (!creds) throw new Error('Credenciais não configuradas. Abra Configurações.');

      // Sessão em cache pode estar velha/inválida — força login limpo no reconnect manual.
      clearCachedSession();

      const MAX_ATTEMPTS = 3;
      const RETRY_DELAY_MS = 1_200;
      let lastErr: unknown = null;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          await loginHttp(creds.email, creds.password);
          logger.info(`Login HTTP concluído (tentativa ${attempt}/${MAX_ATTEMPTS}).`);
          emitStatus(win, 'connected');
          return ok();
        } catch (err) {
          lastErr = err;
          logger.warn(
            `Login HTTP falhou (tentativa ${attempt}/${MAX_ATTEMPTS}): ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          // Credencial inválida não melhora com retry — aborta.
          if (err instanceof BeeforAuthError) break;
          if (attempt < MAX_ATTEMPTS) {
            emitStatus(win, 'reconnecting');
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          }
        }
      }
      // Propaga o erro REAL (surfacar): a UI mostra a mensagem exata.
      throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
    },
  });

  defineHandler({
    channel: IPC.SESSION_LOGIN_GOOGLE,
    errorMessage: 'Google login failed',
    onError: () => emitStatus(getWindow(), 'error'),
    run: async () => {
      const win = getWindow();
      emitStatus(win, 'loading');
      // Abre a página de login do site; captura a resposta de /Token/LoginComGoogle.
      const sessionData = await signInWithGoogle(win);
      clearCachedSession();
      const session = applyGoogleSession(sessionData);
      // Persiste o JWT — login Google não tem senha; o token permite refresh e
      // restore ao reabrir o app (via /Token/LoginComToken).
      await saveGoogleToken(session.token).catch((err) =>
        logger.warn(
          `Falha ao salvar token Google: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
      logger.info('Login Google concluído.');
      emitStatus(win, 'connected');
      return ok();
    },
  });

  defineHandler({
    channel: IPC.SESSION_LOGOUT,
    errorMessage: 'Logout failed',
    run: async () => {
      const win = getWindow();
      await clearSession().catch(() => null);
      clearCachedSession();
      clearHttpCreds();
      setGoogleToken(null);
      await clearGoogleToken().catch(() => null);
      const { invalidateRecipientCache } = await import('../../services/beeforPessoaService');
      await invalidateRecipientCache().catch(() => null);
      const { invalidateStreakCache } = await import('../../services/beeforMoodService');
      await invalidateStreakCache().catch(() => null);
      emitStatus(win, 'disconnected');
      return ok();
    },
  });

  defineHandler({
    channel: IPC.SESSION_VERIFY,
    errorMessage: 'Verify session failed',
    onError: () => emitStatus(getWindow(), 'error'),
    run: async () => {
      const win = getWindow();
      emitStatus(win, 'loading');
      try {
        await getValidSession();
        emitStatus(win, 'connected');
        return ok('connected');
      } catch {
        clearCachedSession();
        emitStatus(win, 'expired');
        return ok('expired');
      }
    },
  });
}

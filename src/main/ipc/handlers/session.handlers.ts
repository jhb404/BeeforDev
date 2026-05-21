import type { BrowserWindow } from 'electron';
import { IPC } from '../../../shared/ipc/index';
import { BeeforClient } from '../../../automation/beefor/beeforClient';
import { doLogout, doVerifySession, performLogin } from '../../../automation/beefor/actions';
import { withPageLock } from '../../../automation/beefor/pageLock';
import { emitStatus, getCurrentStatus } from '../../statusBus';
import { getCredentials } from '../../secureStorage';
import { clearSession, loadSettings, sessionPath } from '../../sessionStore';
import { ok } from '../../../shared/result';
import { defineHandler } from '../defineHandler';
import {
  loginHttp,
  clearCachedSession,
  clearCredentials as clearHttpCreds,
  getCachedSession,
  getValidSession,
} from '../../services/beeforHttpClient';
import { logger } from '../../logger';

async function getLoginMode(): Promise<'playwright' | 'http'> {
  const settings = await loadSettings();
  return settings.loginMode === 'http' ? 'http' : 'playwright';
}

async function ensureHttpSession(usuario: string, senha: string): Promise<void> {
  try {
    if (getCachedSession()) return;
    await loginHttp(usuario, senha);
    logger.info('HTTP session estabelecida.');
  } catch (err) {
    logger.warn(
      `HTTP login falhou: ${err instanceof Error ? err.message : String(err)}`,
    );
    throw err;
  }
}

export function registerSessionHandlers(getWindow: () => BrowserWindow | null) {
  const client = BeeforClient.instance();

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

      const mode = await getLoginMode();
      logger.info(`Session login mode=${mode}`);

      if (mode === 'http') {
        // HTTP-only: sem Chromium
        await loginHttp(creds.email, creds.password);
        logger.info('Login HTTP concluído (sem Playwright).');
        emitStatus(win, 'connected');
        return ok({ mode: 'http' });
      }

      // Playwright legado + warm-up HTTP em paralelo (best-effort)
      await withPageLock(async () => {
        const page = await client.getPage();
        await performLogin(page, creds);
        await client.persistSession(sessionPath());
      });
      try {
        await ensureHttpSession(creds.email, creds.password);
      } catch {
        // não bloqueia — Playwright continua válido
      }
      emitStatus(win, 'connected');
      return ok({ mode: 'playwright' });
    },
  });

  defineHandler({
    channel: IPC.SESSION_LOGOUT,
    errorMessage: 'Logout failed',
    run: async () => {
      const win = getWindow();
      const mode = await getLoginMode();
      if (mode === 'playwright') {
        await withPageLock(async () => {
          const page = await client.getPage().catch(() => null);
          if (page) await doLogout(page);
          await clearSession();
          await client.close();
        });
      } else {
        await clearSession().catch(() => null);
      }
      clearCachedSession();
      clearHttpCreds();
      // Limpa caches de pessoa/time (sessão diferente = dados diferentes)
      const { invalidateRecipientCache } = await import('../../services/beeforPessoaService');
      await invalidateRecipientCache().catch(() => null);
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
      const mode = await getLoginMode();

      if (mode === 'http') {
        try {
          await getValidSession();
          emitStatus(win, 'connected');
          return ok('connected');
        } catch {
          clearCachedSession();
          emitStatus(win, 'expired');
          return ok('expired');
        }
      }

      const isLogged = await withPageLock(async () => {
        const page = await client.getPage();
        return doVerifySession(page);
      });
      if (isLogged) {
        const creds = await getCredentials();
        if (creds) {
          try {
            await ensureHttpSession(creds.email, creds.password);
          } catch {
            // HTTP indisponível — Playwright segue OK
          }
        }
      } else {
        clearCachedSession();
      }
      const next = isLogged ? 'connected' : 'expired';
      emitStatus(win, next);
      return ok(next);
    },
  });
}

import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import keytar from 'keytar';
import {
  COIN2U_LOGIN_URL,
  COIN2U_URL,
  KEYTAR_ACCOUNT_COIN2U_EMAIL,
  KEYTAR_ACCOUNT_COIN2U_PASSWORD,
  KEYTAR_SERVICE,
} from '../../shared/constants';
import { logger } from '../logger';
import { CookieJar } from './cookieJar';

const SESSION_FILE = 'coin2u-session.json';
const LOGIN_TTL_MS = 25 * 60 * 1000;

interface PersistedSession {
  userId: number | null;
  tokenApi: string | null;
  cookies: Record<string, string>;
  info: Record<string, unknown> | null;
  loggedAt: number;
}

function sessionFilePath(): string {
  return path.join(app.getPath('userData'), SESSION_FILE);
}

function maskToken(token: string | null): string {
  if (!token) return '<none>';
  if (token.length <= 8) return '***';
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}

type LoginListener = (snapshot: {
  userId: number;
  tokenApi: string;
  info: Record<string, unknown>;
}) => void | Promise<void>;

class Coin2uAuthManager {
  private jar = new CookieJar();
  private userId: number | null = null;
  private tokenApi: string | null = null;
  private info: Record<string, unknown> | null = null;
  private loggedAt = 0;
  private loadedFromDisk = false;
  private inflightLogin: Promise<void> | null = null;
  private loginListeners = new Set<LoginListener>();

  onLogin(fn: LoginListener): () => void {
    this.loginListeners.add(fn);
    return () => this.loginListeners.delete(fn);
  }

  async loadFromDisk(): Promise<void> {
    if (this.loadedFromDisk) return;
    this.loadedFromDisk = true;
    try {
      const raw = await fs.readFile(sessionFilePath(), 'utf-8');
      const parsed: PersistedSession = JSON.parse(raw);
      this.userId = parsed.userId ?? null;
      this.tokenApi = parsed.tokenApi ?? null;
      this.info = parsed.info ?? null;
      this.loggedAt = parsed.loggedAt ?? 0;
      this.jar.loadRecord(parsed.cookies);
      logger.info(
        `coin2u: session loaded from disk userId=${this.userId} token=${maskToken(this.tokenApi)} cookies=${this.jar.size()} age=${Math.round(
          (Date.now() - this.loggedAt) / 1000,
        )}s`,
      );
    } catch (err: any) {
      if (err?.code !== 'ENOENT') {
        logger.warn(`coin2u: failed to load persisted session: ${err?.message}`);
      }
    }
  }

  private async persist(): Promise<void> {
    const payload: PersistedSession = {
      userId: this.userId,
      tokenApi: this.tokenApi,
      info: this.info,
      cookies: this.jar.toRecord(),
      loggedAt: this.loggedAt,
    };
    try {
      await fs.writeFile(sessionFilePath(), JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err: any) {
      logger.warn(`coin2u: persist session failed: ${err?.message}`);
    }
  }

  async clear(): Promise<void> {
    this.jar.clear();
    this.userId = null;
    this.tokenApi = null;
    this.info = null;
    this.loggedAt = 0;
    try {
      await fs.unlink(sessionFilePath());
    } catch (err: any) {
      if (err?.code !== 'ENOENT') {
        logger.warn(`coin2u: clear session file failed: ${err?.message}`);
      }
    }
  }

  isStale(): boolean {
    if (!this.tokenApi || !this.userId) return true;
    return Date.now() - this.loggedAt > LOGIN_TTL_MS;
  }

  getUserId(): number | null {
    return this.userId;
  }

  getTokenApi(): string | null {
    return this.tokenApi;
  }

  getInfo(): Record<string, unknown> | null {
    return this.info;
  }

  getLoggedAt(): number {
    return this.loggedAt;
  }

  /**
   * Performs login per HAR: POST JSON to /Login/Authenticate.
   * Captures Info.UserId + Info.TokenApi + Set-Cookie. Persists.
   * De-dupes concurrent calls via inflightLogin.
   */
  async login(): Promise<void> {
    if (this.inflightLogin) return this.inflightLogin;
    this.inflightLogin = this.doLogin().finally(() => {
      this.inflightLogin = null;
    });
    return this.inflightLogin;
  }

  private async doLogin(): Promise<void> {
    const creds = await getCoin2uCredentials();
    if (!creds) throw new Error('Credenciais Coin2U não configuradas');

    logger.info(`coin2u: login start email=${creds.email}`);

    const body = JSON.stringify({
      Email: creds.email,
      Password: creds.password,
      IsThereLoginError: false,
      ErrorMessage: '',
    });

    const res = await fetch(COIN2U_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        Origin: COIN2U_URL,
        Referer: `${COIN2U_URL}/`,
        Cookie: this.jar.toHeader(),
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
      },
      body,
      redirect: 'manual',
    });

    this.jar.setFromHeader(res.headers.get('set-cookie'));

    if (res.status >= 400) {
      throw new Error(`Login Coin2U falhou: HTTP ${res.status}`);
    }

    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error('Coin2U login: resposta inválida (não-JSON)');
    }

    if (json?.IsThereLoginError) {
      throw new Error(json.ErrorMessage || 'Credenciais Coin2U inválidas');
    }

    const info = json?.Info ?? json?.info ?? null;
    if (!info || typeof info !== 'object') {
      throw new Error('Coin2U login: payload sem Info');
    }

    const userId = Number(info.UserId ?? info.userId);
    const token = String(info.TokenApi ?? info.tokenApi ?? '');

    if (!Number.isFinite(userId) || userId <= 0) {
      throw new Error('Coin2U login: UserId ausente na resposta');
    }
    if (!token) {
      throw new Error('Coin2U login: TokenApi ausente na resposta');
    }

    this.userId = userId;
    this.tokenApi = token;
    this.info = info;
    this.loggedAt = Date.now();

    // Backend uses token auth (no Set-Cookie on login). Mimic frontend exactly:
    //   $cookies.put('apitoken', token)
    //   $cookies.put('info', JSON.stringify(Info))
    // Authorization header on subsequent calls = raw token (no "Bearer " prefix).
    this.jar.set('apitoken', token);
    try {
      const infoForCookie = {
        IsAuthenticated: true,
        ...info,
        TokenApi: token,
      };
      this.jar.set('info', encodeURIComponent(JSON.stringify(infoForCookie)));
    } catch {
      /* info cookie is best-effort; auth header alone usually suffices */
    }

    await this.persist();
    logger.info(
      `coin2u: login OK userId=${userId} token=${maskToken(token)} cookies=${this.jar.size()}`,
    );

    const snapshot = { userId, tokenApi: token, info };
    for (const fn of this.loginListeners) {
      try {
        await fn(snapshot);
      } catch (err) {
        logger.warn(
          `coin2u: login listener failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  async ensureFresh(): Promise<void> {
    if (this.isStale()) {
      logger.info('coin2u: session stale → re-login');
      await this.login();
    }
  }

  cookieHeader(): string {
    return this.jar.toHeader();
  }

  applySetCookie(header: string | null): void {
    this.jar.setFromHeader(header);
  }

  /** Marks session invalidated (e.g. after 401 from API). Caller decides whether to re-login. */
  invalidate(): void {
    logger.warn('coin2u: session invalidated');
    this.tokenApi = null;
    this.loggedAt = 0;
  }
}

export const coin2uAuth = new Coin2uAuthManager();

export async function getCoin2uCredentials(): Promise<{ email: string; password: string } | null> {
  const email = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_COIN2U_EMAIL);
  const password = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_COIN2U_PASSWORD);
  if (!email || !password) return null;
  return { email, password };
}

export async function saveCoin2uCredentials(creds: {
  email: string;
  password: string;
}): Promise<void> {
  await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_COIN2U_EMAIL, creds.email);
  await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_COIN2U_PASSWORD, creds.password);
  await coin2uAuth.clear();
  logger.info(`coin2u: credentials saved (${creds.email})`);
}

export async function clearCoin2uCredentials(): Promise<void> {
  await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_COIN2U_EMAIL);
  await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_COIN2U_PASSWORD);
  await coin2uAuth.clear();
  logger.info('coin2u: credentials cleared');
}

export function onCoin2uLogin(
  fn: (snap: {
    userId: number;
    tokenApi: string;
    info: Record<string, unknown>;
  }) => void | Promise<void>,
): () => void {
  return coin2uAuth.onLogin(fn);
}

export async function coin2uVerifyLogin(): Promise<{ userId: number; email: string }> {
  await coin2uAuth.loadFromDisk();
  await coin2uAuth.login();
  const userId = coin2uAuth.getUserId();
  const creds = await getCoin2uCredentials();
  if (!userId || !creds) throw new Error('Coin2U: login não retornou dados');
  return { userId, email: creds.email };
}

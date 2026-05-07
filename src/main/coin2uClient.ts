import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import keytar from 'keytar';
import {
  COIN2U_DASHBOARD_URL,
  COIN2U_LOGIN_URL,
  COIN2U_URL,
  KEYTAR_ACCOUNT_COIN2U_EMAIL,
  KEYTAR_ACCOUNT_COIN2U_PASSWORD,
  KEYTAR_SERVICE,
} from '../shared/constants';
import type {
  Coin2uCredentials,
  Coin2uDashboard,
  Coin2uLog,
  Coin2uMember,
  Coin2uShop,
  Coin2uShopItem,
  Coin2uTransaction,
  Coin2uTransferRequest,
} from '../shared/types';
import { logger } from './logger';

/**
 * Coin2U Auth + Coins manager.
 *
 * Flow (per HAR):
 *   POST /Login/Authenticate (JSON) → { Info: { UserId, TokenApi, ... } }
 *   GET  /VentronCoins/GetDashboard?userId=<UserId>&token=<TokenApi>
 *
 * Persists session (cookies + UserId + TokenApi) to userData/coin2u-session.json
 * so reload/relaunch reuses it. Auto re-login on 401/302/403 or stale TTL.
 *
 * Credentials (email/password) live in keytar; never written to disk.
 */

const SESSION_FILE = 'coin2u-session.json';
const LOGIN_TTL_MS = 25 * 60 * 1000;

interface PersistedSession {
  userId: number | null;
  tokenApi: string | null;
  cookies: Record<string, string>;
  info: Record<string, unknown> | null;
  loggedAt: number;
}

class CookieJar {
  private cookies = new Map<string, string>();

  set(name: string, value: string): void {
    this.cookies.set(name, value);
  }

  setFromHeader(setCookieHeader: string | null): void {
    if (!setCookieHeader) return;
    const parts = setCookieHeader.split(/,(?=\s*[A-Za-z0-9_.\-]+=)/);
    for (const part of parts) {
      const first = part.split(';')[0]?.trim();
      if (!first) continue;
      const eq = first.indexOf('=');
      if (eq <= 0) continue;
      const name = first.slice(0, eq).trim();
      const value = first.slice(eq + 1).trim();
      this.cookies.set(name, value);
    }
  }

  toHeader(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  size(): number {
    return this.cookies.size;
  }

  clear(): void {
    this.cookies.clear();
  }

  toRecord(): Record<string, string> {
    return Object.fromEntries(this.cookies);
  }

  loadRecord(record: Record<string, string> | undefined): void {
    if (!record) return;
    this.cookies.clear();
    for (const [k, v] of Object.entries(record)) this.cookies.set(k, v);
  }
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
    // Browser-observed shape: info JSON has IsAuthenticated/UserId/Name/Email/.../TokenApi flat.
    // Authorization header on subsequent calls = raw token (no "Bearer " prefix).
    this.jar.set('apitoken', token);
    try {
      const infoForCookie = {
        IsAuthenticated: true,
        ...info,
        TokenApi: token,
      };
      // Note: cookies escape commas/semicolons via encodeURIComponent, matching frontend behavior.
      this.jar.set('info', encodeURIComponent(JSON.stringify(infoForCookie)));
    } catch {
      /* info cookie is best-effort; auth header alone usually suffices */
    }

    await this.persist();
    logger.info(
      `coin2u: login OK userId=${userId} token=${maskToken(token)} cookies=${this.jar.size()}`,
    );

    // Notify listeners so caller can persist captured data (e.g. into settings)
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

  /**
   * Marks session invalidated (e.g. after 401 from API).
   * Caller decides whether to re-login.
   */
  invalidate(): void {
    logger.warn('coin2u: session invalidated');
    this.tokenApi = null;
    this.loggedAt = 0;
  }
}

const auth = new Coin2uAuthManager();

export async function initCoin2u(): Promise<void> {
  await auth.loadFromDisk();
}

export async function saveCoin2uCredentials(creds: {
  email: string;
  password: string;
}): Promise<void> {
  await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_COIN2U_EMAIL, creds.email);
  await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_COIN2U_PASSWORD, creds.password);
  // Force fresh login on next call so new creds take effect immediately
  await auth.clear();
  logger.info(`coin2u: credentials saved (${creds.email})`);
}

export async function getCoin2uCredentials(): Promise<{ email: string; password: string } | null> {
  const email = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_COIN2U_EMAIL);
  const password = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_COIN2U_PASSWORD);
  if (!email || !password) return null;
  return { email, password };
}

export async function clearCoin2uCredentials(): Promise<void> {
  await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_COIN2U_EMAIL);
  await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_COIN2U_PASSWORD);
  await auth.clear();
  logger.info('coin2u: credentials cleared');
}

/**
 * Returns email + the auto-captured userId (if any). userId is no longer
 * required from the user — extracted from login response.
 */
export async function getMaskedCoin2uCreds(
  fallbackUserId: number | undefined,
): Promise<Coin2uCredentials | null> {
  await auth.loadFromDisk();
  const email = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_COIN2U_EMAIL);
  if (!email) return null;
  const userId = auth.getUserId() ?? fallbackUserId;
  return { email, userId };
}

export function getCoin2uUserId(): number | null {
  return auth.getUserId();
}

export function getCoin2uTokenApi(): string | null {
  return auth.getTokenApi();
}

export function getCoin2uInfo(): Record<string, unknown> | null {
  return auth.getInfo();
}

export function onCoin2uLogin(
  fn: (snap: { userId: number; tokenApi: string; info: Record<string, unknown> }) => void | Promise<void>,
): () => void {
  return auth.onLogin(fn);
}

/**
 * Fetches /User/GetOrgList and parses array of orgs.
 * Returns [] on failure (best-effort cache; non-critical).
 */
export async function fetchCoin2uOrgs(): Promise<unknown[]> {
  await auth.loadFromDisk();
  await auth.ensureFresh();
  const userId = auth.getUserId();
  if (!userId) return [];
  try {
    const res = await coin2uAuthedGet(`/User/GetOrgList?userId=${userId}`);
    if (res.status >= 400) return [];
    const text = await res.text();
    const json = JSON.parse(text);
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.Orgs)) return json.Orgs;
    return [];
  } catch (err) {
    logger.warn(`coin2u: fetch orgs failed: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

/**
 * Generic authenticated GET helper. Re-login on 401/302/403.
 * Use this for any future Coin2U endpoint impl.
 */
export async function coin2uAuthedGet(pathOrUrl: string): Promise<Response> {
  await auth.loadFromDisk();
  await auth.ensureFresh();

  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${COIN2U_URL}${pathOrUrl}`;

  const doFetch = async () => {
    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      Origin: COIN2U_URL,
      Referer: `${COIN2U_URL}/`,
      Cookie: auth.cookieHeader(),
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
    };
    const tk = auth.getTokenApi();
    if (tk) {
      // Coin2U sends raw token (no "Bearer ") in Authorization header.
      // Cookie 'apitoken' carries the same value; cookie 'info' carries Info JSON URL-encoded.
      headers.Authorization = tk;
    }
    return fetch(url, { method: 'GET', headers, redirect: 'manual' });
  };

  let res = await doFetch();
  auth.applySetCookie(res.headers.get('set-cookie'));

  // Retry once on auth failure. Avoid infinite loop: only retry if we had a
  // stale session at call time (i.e. the just-attempted token may already be expired).
  if (res.status === 401 || res.status === 302 || res.status === 403) {
    const ageMs = Date.now() - (auth.getLoggedAt() ?? 0);
    if (ageMs > 5_000) {
      logger.info(`coin2u: ${res.status} on ${url} → re-login (age=${Math.round(ageMs / 1000)}s)`);
      auth.invalidate();
      await auth.login();
      res = await doFetch();
      auth.applySetCookie(res.headers.get('set-cookie'));
    } else {
      logger.warn(
        `coin2u: ${res.status} on ${url} with fresh token (age=${Math.round(ageMs / 1000)}s) — not retrying to avoid loop`,
      );
    }
  }

  return res;
}

export async function coin2uAuthedPost(pathOrUrl: string, payload: unknown): Promise<Response> {
  await auth.loadFromDisk();
  await auth.ensureFresh();

  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${COIN2U_URL}${pathOrUrl}`;
  const body = JSON.stringify(payload);

  const doFetch = async () => {
    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Content-Type': 'application/json;charset=UTF-8',
      Origin: COIN2U_URL,
      Referer: `${COIN2U_URL}/`,
      Cookie: auth.cookieHeader(),
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
    };
    const tk = auth.getTokenApi();
    if (tk) headers.Authorization = tk;
    return fetch(url, { method: 'POST', headers, body, redirect: 'manual' });
  };

  let res = await doFetch();
  auth.applySetCookie(res.headers.get('set-cookie'));
  if (res.status === 401 || res.status === 302 || res.status === 403) {
    const ageMs = Date.now() - (auth.getLoggedAt() ?? 0);
    if (ageMs > 5_000) {
      logger.info(`coin2u: ${res.status} on ${url} POST → re-login`);
      auth.invalidate();
      await auth.login();
      res = await doFetch();
      auth.applySetCookie(res.headers.get('set-cookie'));
    }
  }

  return res;
}

function parseMembers(value: unknown): Coin2uMember[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((m: any) => ({
      Value: Number(m?.Value ?? m?.value ?? 0),
      Text: String(m?.Text ?? m?.text ?? '').trim(),
    }))
    .filter((m) => Number.isFinite(m.Value) && m.Value > 0 && m.Text);
}

function parseTransactions(value: unknown): Coin2uTransaction[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((t: any) => ({
      TransactionId: Number(t?.TransactionId ?? t?.transactionId ?? 0),
      Amount: Number(t?.Amount ?? t?.amount ?? t?.Coins ?? 0),
      FromName: String(t?.FromName ?? t?.fromName ?? ''),
      FromId: Number(t?.FromId ?? t?.fromId ?? 0),
      ToName: String(t?.ToName ?? t?.toName ?? ''),
      ToId: Number(t?.ToId ?? t?.toId ?? 0),
      Date: String(t?.Date ?? t?.date ?? ''),
      ShopItemId: t?.ShopItemId ?? null,
      ShopItemName: t?.ShopItemName ?? null,
      Coins: t?.Coins == null ? null : Number(t.Coins),
      Message: t?.Message ?? null,
      GenesisBookId: t?.GenesisBookId ?? null,
      ProviderId: t?.ProviderId ?? null,
      ProviderIdName: t?.ProviderIdName ?? null,
    }))
    .filter((t) => Number.isFinite(t.TransactionId) && t.TransactionId > 0);
}

function parseShopItems(value: unknown): Coin2uShopItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any) => ({
      Id: Number(item?.Id ?? item?.id ?? 0),
      Name: String(item?.Name ?? item?.name ?? '').trim(),
      Imagem: item?.Imagem || item?.imagem || item?.Image || null,
      Price: Number(item?.Price ?? item?.price ?? 0),
      PriceInReal: Number(item?.PriceInReal ?? item?.priceInReal ?? 0),
      LastUpdate: item?.LastUpdate ?? item?.lastUpdate ?? null,
      Active: Boolean(item?.Active ?? item?.active ?? false),
      Stock: Number(item?.Stock ?? item?.stock ?? 0),
      Description: String(item?.Description ?? item?.description ?? '').trim(),
      PurchaseInstruction: item?.PurchaseInstruction ?? item?.purchaseInstruction ?? null,
      category: item?.category
        ? {
            Id: Number(item.category.Id ?? item.category.id ?? 0),
            Decription: String(item.category.Decription ?? item.category.Description ?? '').trim(),
            BitActive: item.category.BitActive,
          }
        : null,
    }))
    .filter((item) => Number.isFinite(item.Id) && item.Id > 0 && item.Name);
}

export async function getCoin2uDashboard(
  fallbackUserId?: number,
): Promise<Coin2uDashboard> {
  await auth.loadFromDisk();
  await auth.ensureFresh();

  const userId = auth.getUserId() ?? fallbackUserId;
  const token = auth.getTokenApi();
  if (!userId) throw new Error('Coin2U: userId indisponível (faça login)');
  if (!token) throw new Error('Coin2U: token indisponível (faça login)');

  const url = `${COIN2U_DASHBOARD_URL}?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
  const res = await coin2uAuthedGet(url);

  if (res.status >= 400) {
    throw new Error(`Coin2U dashboard HTTP ${res.status}`);
  }

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Coin2U dashboard: resposta inválida (não-JSON)');
  }

  return {
    Coins: Number(json.Coins ?? 0),
    CurrentQuotation: Number(json.CurrentQuotation ?? 0),
    DaysToExpire: Number(json.DaysToExpire ?? 0),
    ExchangeCoins: Number(json.ExchangeCoins ?? 0),
    Members: parseMembers(json.Members),
    RecentTransactions: parseTransactions(
      json.RecentTransactions ?? json.Transactions ?? json.Log ?? json.LastTransactions,
    ),
  };
}

export async function getCoin2uLog(fallbackUserId?: number): Promise<Coin2uLog> {
  await auth.loadFromDisk();
  await auth.ensureFresh();

  const userId = auth.getUserId() ?? fallbackUserId;
  const token = auth.getTokenApi();
  if (!userId) throw new Error('Coin2U: userId indisponível (faça login)');
  if (!token) throw new Error('Coin2U: token indisponível (faça login)');

  const url = `/VentronCoins/GetLog?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
  const res = await coin2uAuthedGet(url);
  if (res.status >= 400) throw new Error(`Coin2U log HTTP ${res.status}`);

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Coin2U log: resposta inválida (não-JSON)');
  }

  return { Log: parseTransactions(json.Log ?? json.log) };
}

export async function getCoin2uShop(
  fallbackUserId?: number,
  fallbackInfo?: Record<string, unknown>,
): Promise<Coin2uShop> {
  await auth.loadFromDisk();
  await auth.ensureFresh();

  const userId = auth.getUserId() ?? fallbackUserId;
  const token = auth.getTokenApi();
  const info = auth.getInfo() ?? fallbackInfo ?? null;
  const organizationId = Number(
    info?.OrganizationId ?? info?.organizationId ?? info?.OrgId ?? info?.orgId ?? 0,
  );
  if (!userId) throw new Error('Coin2U: userId indisponível (faça login)');
  if (!organizationId) throw new Error('Coin2U: organizationId indisponível (faça login)');

  const url = `/VentronCoins/GetShop?organizationId=${encodeURIComponent(organizationId)}&userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token ?? '')}`;
  const res = await coin2uAuthedGet(url);
  if (res.status >= 400) throw new Error(`Coin2U shop HTTP ${res.status}`);

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Coin2U shop: resposta inválida (não-JSON)');
  }

  return {
    Coins: Number(json.Coins ?? 0),
    ShopItems: parseShopItems(json.ShopItems ?? json.shopItems ?? json.Items ?? json.items),
  };
}

export async function transferCoin2uCoins(
  req: Coin2uTransferRequest,
  fallbackUserId?: number,
): Promise<boolean> {
  await auth.loadFromDisk();
  await auth.ensureFresh();

  const from = auth.getUserId() ?? fallbackUserId;
  if (!from) throw new Error('Coin2U: userId indisponível (faça login)');
  if (!Number.isFinite(req.To) || req.To <= 0) throw new Error('Escolha quem vai receber.');
  if (!Number.isFinite(req.Amount) || req.Amount <= 0) throw new Error('Informe uma quantia válida.');

  const res = await coin2uAuthedPost('/VentronCoins/TransferCoins', {
    transferCoins: {
      To: req.To,
      From: from,
      Amount: Math.floor(req.Amount),
      Message: req.Message ?? '',
    },
  });

  if (res.status >= 400) throw new Error(`Coin2U transfer HTTP ${res.status}`);
  const text = (await res.text()).trim().toLowerCase();
  return text === '1' || text === 'true';
}

/**
 * Force login now (for "Test connection" buttons / verify flows).
 * Returns captured userId.
 */
export async function coin2uVerifyLogin(): Promise<{ userId: number; email: string }> {
  await auth.loadFromDisk();
  await auth.login();
  const userId = auth.getUserId();
  const creds = await getCoin2uCredentials();
  if (!userId || !creds) throw new Error('Coin2U: login não retornou dados');
  return { userId, email: creds.email };
}

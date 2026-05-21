import { getBeeforTokenApi, getBeeforApiBase } from '../../shared/constants';
import { logger } from '../logger';

/**
 * Electron usa undici p/ fetch. Connection pooling/keep-alive é nativo do undici —
 * NÃO passar node:http Agent (corrompe request → server recebe corpo inválido).
 */
async function fetchKeepAlive(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, init);
}

export interface BeeforSession {
  token: string;
  idPessoa: string;
  idOrganizacao: string | null;
  nome?: string;
  email?: string;
  cachedAt: number;
}

interface LoginRequest {
  usuario: string;
  senha: string;
}

const TTL_MS = 25 * 60 * 1000;

let cached: BeeforSession | null = null;
let pendingRefresh: Promise<BeeforSession | null> | null = null;
let credentials: { usuario: string; senha: string } | null = null;

export class BeeforAuthError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'BeeforAuthError';
  }
}

export class BeeforApiError extends Error {
  constructor(message: string, public status: number, public body?: string) {
    super(message);
    this.name = 'BeeforApiError';
  }
}

export function setCredentials(usuario: string, senha: string): void {
  credentials = { usuario, senha };
}

export function clearCredentials(): void {
  credentials = null;
}

export function getCachedSession(): BeeforSession | null {
  if (!cached) return null;
  if (Date.now() - cached.cachedAt > TTL_MS) {
    cached = null;
    return null;
  }
  return cached;
}

export function setCachedSession(session: BeeforSession): void {
  cached = session;
}

export function clearCachedSession(): void {
  cached = null;
}

export async function loginHttp(usuario: string, senha: string): Promise<BeeforSession> {
  const body: LoginRequest = { usuario, senha };
  const url = `${getBeeforTokenApi()}`;
  logger.info(`HTTP login → ${url}`);

  // /Token está sob baseUrl + tem body → passa pelo crypto interceptor do front.
  const { encryptBeeforBody } = await import('./beeforCrypto');
  const enc = encryptBeeforBody(body);

  const response = await fetchKeepAlive(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/plain, */*',
      ...enc.headers,
    },
    body: enc.body, // base64 puro — server faz FromBase64String direto
  });

  if (response.status === 401 || response.status === 403) {
    throw new BeeforAuthError('Credenciais inválidas.', response.status);
  }
  if (!response.ok) {
    const txt = await response.text().catch(() => '');
    throw new BeeforApiError(
      `Login falhou ${response.status}: ${txt.slice(0, 200)}`,
      response.status,
      txt,
    );
  }

  const data = (await response.json()) as Record<string, unknown>;
  const token = String(data?.token ?? '');
  const idPessoa = String(data?.idPessoa ?? '');
  if (!token || !idPessoa) {
    throw new BeeforAuthError('Resposta de login sem token/idPessoa.');
  }

  const session: BeeforSession = {
    token,
    idPessoa,
    idOrganizacao: data?.idOrganizacao ? String(data.idOrganizacao) : null,
    nome: typeof data?.nome === 'string' ? (data.nome as string) : undefined,
    email: typeof data?.email === 'string' ? (data.email as string) : undefined,
    cachedAt: Date.now(),
  };
  setCachedSession(session);
  setCredentials(usuario, senha);
  return session;
}

async function loadCredentialsFromKeychain(): Promise<{ usuario: string; senha: string } | null> {
  try {
    // Lazy import — evita ciclo de dependência (secureStorage usa keytar).
    const { getCredentials } = await import('../secureStorage');
    const creds = await getCredentials();
    if (creds?.email && creds?.password) {
      return { usuario: creds.email, senha: creds.password };
    }
  } catch (err) {
    logger.warn(
      `Falha ao ler credenciais do keytar: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  return null;
}

async function refreshSession(): Promise<BeeforSession | null> {
  if (!credentials) {
    const fromStore = await loadCredentialsFromKeychain();
    if (fromStore) credentials = fromStore;
  }
  if (!credentials) return null;
  if (!pendingRefresh) {
    pendingRefresh = (async () => {
      try {
        return await loginHttp(credentials!.usuario, credentials!.senha);
      } catch (err) {
        logger.warn(
          `Auto-refresh login failed: ${err instanceof Error ? err.message : String(err)}`,
        );
        return null;
      } finally {
        pendingRefresh = null;
      }
    })();
  }
  return pendingRefresh;
}

export async function getValidSession(): Promise<BeeforSession> {
  const current = getCachedSession();
  if (current) return current;
  const refreshed = await refreshSession();
  if (!refreshed) {
    throw new BeeforAuthError('Sessão expirada e sem credenciais para renovar.');
  }
  return refreshed;
}

interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** If true, do not auto-retry on 401. */
  noRetry?: boolean;
}

function buildUrl(path: string, query?: HttpRequestOptions['query']): string {
  const base = path.startsWith('http') ? path : `${getBeeforApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return base;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    params.append(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${base}${base.includes('?') ? '&' : '?'}${qs}` : base;
}

export async function beeforHttpRequest<T = unknown>(
  pathOrUrl: string,
  options: HttpRequestOptions = {},
): Promise<T> {
  const session = await getValidSession();
  const url = buildUrl(pathOrUrl, options.query);
  const method = options.method ?? 'GET';

  // Replica RequestInterceptor do front: POST/PUT com body em baseUrl → AES + X-Encryption-Key.
  // (timesheet roda em baseUrlProjectPro, fora dessa condição.)
  const hasBody = options.body !== undefined;
  const isBaseUrl = url.toLowerCase().includes(getBeeforApiBase().toLowerCase());
  const needsCrypto = hasBody && isBaseUrl;

  let bodyStr: string | undefined;
  const headers: Record<string, string> = {
    accept: 'application/json, text/plain, */*',
    authorization: `Bearer ${session.token}`,
  };

  if (hasBody) {
    if (needsCrypto) {
      const { encryptBeeforBody } = await import('./beeforCrypto');
      const enc = encryptBeeforBody(options.body);
      // Server (DecryptionRequestMiddleware) faz Convert.FromBase64String(body cru).
      // Body = string base64 PURA, sem aspas JSON.
      bodyStr = enc.body;
      headers['content-type'] = 'application/json';
      Object.assign(headers, enc.headers);
    } else {
      bodyStr = JSON.stringify(options.body);
      headers['content-type'] = 'application/json';
    }
  }

  const init: RequestInit = {
    method,
    headers,
    body: bodyStr,
  };

  const response = await fetchKeepAlive(url, init);

  if (response.status === 401 && !options.noRetry) {
    logger.warn(`401 on ${method} ${url} — invalidating cache and retrying.`);
    clearCachedSession();
    return beeforHttpRequest<T>(pathOrUrl, { ...options, noRetry: true });
  }

  if (!response.ok) {
    const txt = await response.text().catch(() => '');
    throw new BeeforApiError(
      `${method} ${url} → ${response.status}: ${txt.slice(0, 300)}`,
      response.status,
      txt,
    );
  }

  const text = await response.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export const beeforHttp = {
  get: <T = unknown>(path: string, query?: HttpRequestOptions['query']) =>
    beeforHttpRequest<T>(path, { method: 'GET', query }),
  post: <T = unknown>(path: string, body?: unknown, query?: HttpRequestOptions['query']) =>
    beeforHttpRequest<T>(path, { method: 'POST', body, query }),
  put: <T = unknown>(path: string, body?: unknown, query?: HttpRequestOptions['query']) =>
    beeforHttpRequest<T>(path, { method: 'PUT', body, query }),
  delete: <T = unknown>(path: string, query?: HttpRequestOptions['query']) =>
    beeforHttpRequest<T>(path, { method: 'DELETE', query }),
};

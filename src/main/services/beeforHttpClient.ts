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
  /** Id do usuário (≠ idPessoa). Necessário p/ TrocarOrganizacao. */
  idUsuario: string | null;
  idOrganizacao: string | null;
  nome?: string;
  email?: string;
  nomeOrganizacao?: string;
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

/**
 * Org selecionada manualmente via troca de organização. Sobrevive a re-logins:
 * o login sempre volta na org default, então após cada refresh re-aplicamos
 * TrocarOrganizacao se a org ativa diferir. Espelha o `window.location.reload`
 * + token escopado do goobeeteams.
 */
let activeOrgId: string | null = null;

export function setActiveOrg(idOrganizacao: string | null): void {
  activeOrgId = idOrganizacao;
}

export function getActiveOrg(): string | null {
  return activeOrgId;
}

export function clearActiveOrg(): void {
  activeOrgId = null;
}

export class BeeforAuthError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'BeeforAuthError';
  }
}

export class BeeforApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string,
  ) {
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
  const url = `${getBeeforTokenApi()}`;
  logger.info(`HTTP login → ${url} usuario=${usuario}`);

  // Replica o front: RSA-encripta usuario+senha individualmente, depois AES-encripta o body.
  const { encryptBeeforBody, rsaEncrypt } = await import('./beeforCrypto');
  const body: LoginRequest = { usuario: rsaEncrypt(usuario), senha: rsaEncrypt(senha) };
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
  logger.info(`Login response keys: ${Object.keys(data).join(', ')}`);
  logger.info(
    `Login response token=${JSON.stringify(data?.token)} idPessoa=${JSON.stringify(data?.idPessoa)}`,
  );
  const token = String(data?.token ?? '');
  const idPessoa = String(data?.idPessoa ?? '');
  const NULL_UUID = '00000000-0000-0000-0000-000000000000';
  if (!token || !idPessoa || idPessoa === NULL_UUID) {
    logger.warn(`Login rejeitado: token vazio=${!token} idPessoa=${idPessoa}`);
    throw new BeeforAuthError('Credenciais inválidas ou conta sem acesso.');
  }

  const session: BeeforSession = {
    token,
    idPessoa,
    idUsuario: data?.id ? String(data.id) : null,
    idOrganizacao: data?.idOrganizacao ? String(data.idOrganizacao) : null,
    nome: typeof data?.nome === 'string' ? (data.nome as string) : undefined,
    email: typeof data?.email === 'string' ? (data.email as string) : undefined,
    nomeOrganizacao:
      typeof data?.nomeOrganizacao === 'string' ? (data.nomeOrganizacao as string) : undefined,
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
    logger.info(
      `Keychain pw-check: first3=${creds?.password?.slice(0, 3) ?? 'null'} len=${creds?.password?.length ?? 0} last1=${creds?.password?.slice(-1) ?? 'null'}`,
    );
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
        const session = await loginHttp(credentials!.usuario, credentials!.senha);
        // Login volta na org default. Se havia org selecionada manualmente, re-aplica
        // o token escopado pra manter a troca através de refreshes (TTL/401).
        if (activeOrgId && activeOrgId !== session.idOrganizacao) {
          try {
            return await trocarOrganizacaoToken(activeOrgId);
          } catch (err) {
            logger.warn(
              `Re-scope de org pós-refresh falhou (${activeOrgId}): ${err instanceof Error ? err.message : String(err)}`,
            );
            return session;
          }
        }
        return session;
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
  /** Internal: tentativa atual de retry p/ erros transitórios (5xx). */
  _transientAttempt?: number;
}

/** Status transitórios do gateway/servidor — valem retry automático em GET. */
const TRANSIENT_STATUS = new Set([502, 503, 504]);
const MAX_TRANSIENT_RETRIES = 4;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUrl(path: string, query?: HttpRequestOptions['query']): string {
  const base = path.startsWith('http')
    ? path
    : `${getBeeforApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
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
  // Front RequestInterceptor encripta apenas POST/PUT com body. DELETE/PATCH vão crus.
  const isCryptoMethod = method === 'POST' || method === 'PUT';
  const needsCrypto = hasBody && isBaseUrl && isCryptoMethod;

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

  // 502/503/504 = blip transitório do gateway. Em GET (idempotente) tenta de novo
  // algumas vezes com backoff antes de propagar o erro pra UI.
  if (TRANSIENT_STATUS.has(response.status) && method === 'GET') {
    const attempt = options._transientAttempt ?? 0;
    if (attempt < MAX_TRANSIENT_RETRIES) {
      await response.text().catch(() => ''); // drena o corpo p/ liberar a conexão
      const wait = 400 * 2 ** attempt; // 400, 800, 1600, 3200ms
      logger.warn(
        `${response.status} on GET ${url} — retry ${attempt + 1}/${MAX_TRANSIENT_RETRIES} em ${wait}ms`,
      );
      await sleep(wait);
      return beeforHttpRequest<T>(pathOrUrl, { ...options, _transientAttempt: attempt + 1 });
    }
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

/**
 * Troca a organização ativa: pede um token novo escopado pra org (POST /Token/TrocarOrganizacao),
 * substitui a sessão em cache e marca a org como ativa (sobrevive a re-logins).
 * Espelha `pegarNovoToken` do goobeeteams. O caller deve recarregar/invalidar dados org-scoped.
 */
export async function trocarOrganizacaoToken(idOrganizacao: string): Promise<BeeforSession> {
  const current = await getValidSession();
  if (!current.idUsuario) {
    throw new BeeforAuthError(
      'Sessão sem idUsuario — login não retornou `id`, impossível trocar de organização.',
    );
  }

  const data = await beeforHttpRequest<Record<string, unknown>>('/Token/TrocarOrganizacao', {
    method: 'POST',
    body: { IdUsuario: current.idUsuario, IdOrganizacao: idOrganizacao },
    noRetry: true,
  });

  // Resposta vem double-wrapped (Ok(Ok(vm))): { value: {...} }. Espelha front: data.token ? data : data.value.
  const raw: Record<string, unknown> = (data?.token ? data : (data?.value as any)) ?? data ?? {};

  const token = String(raw?.token ?? '');
  const idPessoa = String(raw?.idPessoa ?? current.idPessoa ?? '');
  if (!token) {
    throw new BeeforApiError('TrocarOrganizacao não retornou token.', 500);
  }

  const session: BeeforSession = {
    token,
    idPessoa,
    idUsuario: raw?.id ? String(raw.id) : current.idUsuario,
    idOrganizacao: raw?.idOrganizacao ? String(raw.idOrganizacao) : idOrganizacao,
    nome: typeof raw?.nome === 'string' ? (raw.nome as string) : current.nome,
    email: typeof raw?.email === 'string' ? (raw.email as string) : current.email,
    nomeOrganizacao:
      typeof raw?.nomeOrganizacao === 'string' ? (raw.nomeOrganizacao as string) : undefined,
    cachedAt: Date.now(),
  };

  setCachedSession(session);
  setActiveOrg(session.idOrganizacao);
  logger.info(`Org trocada → ${session.idOrganizacao} (${session.nomeOrganizacao ?? '?'})`);
  return session;
}

/**
 * Upload multipart/form-data. Nao passa pela criptografia AES (so JSON POST/PUT encripta).
 * Mantem Authorization. Usado p/ AdicionarAnexo.
 */
export async function beeforHttpUpload<T = unknown>(
  path: string,
  fields: Record<string, string>,
  file: { name: string; type: string; bytes: ArrayBuffer } | null,
): Promise<T> {
  const session = await getValidSession();
  const url = buildUrl(path);

  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v ?? '');
  if (file) {
    const blob = new Blob([file.bytes], { type: file.type || 'application/octet-stream' });
    form.append('Arquivo', blob, file.name);
  }

  const response = await fetchKeepAlive(url, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      authorization: `Bearer ${session.token}`,
      // content-type definido automaticamente pelo FormData (com boundary)
    },
    body: form,
  });

  if (!response.ok) {
    const txt = await response.text().catch(() => '');
    throw new BeeforApiError(
      `POST ${url} → ${response.status}: ${txt.slice(0, 300)}`,
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
  delete: <T = unknown>(path: string, query?: HttpRequestOptions['query'], body?: unknown) =>
    beeforHttpRequest<T>(path, { method: 'DELETE', query, body }),
};

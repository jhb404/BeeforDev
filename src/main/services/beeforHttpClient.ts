import {
  getBeeforTokenApi,
  getBeeforApiBase,
  getBeeforLoginComTokenApi,
} from '../../shared/constants';
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
 * JWT da sessão Google. Login Google não tem senha, então guardamos o token e
 * renovamos a sessão via /Token/LoginComToken (o JWT dura 60 dias no backend).
 */
let googleToken: string | null = null;

export function setGoogleToken(token: string | null): void {
  googleToken = token;
}

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
    throw new BeeforAuthError('E-mail ou senha inválidos.', response.status);
  }
  if (!response.ok) {
    const txt = await response.text().catch(() => '');
    // O backend devolve 500 (não 401) pra senha errada: o corpo contém
    // "Usuario ou senha invalido". Mapeia pra erro de credencial legível
    // em vez de vazar o stack "No authentication handler is registered...".
    if (/usu[aá]rio ou senha inv[aá]lid/i.test(txt)) {
      throw new BeeforAuthError('E-mail ou senha inválidos.', response.status);
    }
    throw new BeeforApiError(
      `Login falhou ${response.status}: ${txt.slice(0, 200)}`,
      response.status,
      txt,
    );
  }

  const data = (await response.json()) as Record<string, unknown>;
  const session = sessionFromLoginResponse(data);
  setCachedSession(session);
  setCredentials(usuario, senha);
  return session;
}

/** Constrói (e valida) uma BeeforSession a partir do JSON de /Token ou /Token/LoginComGoogle. */
function sessionFromLoginResponse(data: Record<string, unknown>): BeeforSession {
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
  return {
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
}

/**
 * Aplica a sessão do login com Google.
 *
 * A sessão vem PRONTA: capturamos a resposta do POST /Token/LoginComGoogle que o
 * próprio site faz (hook de XHR no googleAuth.ts). A RESPOSTA é JSON claro com o
 * token da sessão, então cacheamos direto.
 *
 * Não há usuario/senha, mas guardamos o JWT em `googleToken`: o refresh automático
 * usa /Token/LoginComToken (o token dura 60 dias), então a sessão Google não morre
 * mais quando o cache de 25min expira.
 */
export function applyGoogleSession(data: Record<string, unknown>): BeeforSession {
  const session = sessionFromLoginResponse(data);
  setCachedSession(session);
  clearCredentials();
  googleToken = session.token;
  logger.info(`Sessão Google aplicada (idPessoa=${session.idPessoa}).`);
  return session;
}

/**
 * Reidrata a sessão a partir de um JWT ainda válido (POST /Token/LoginComToken).
 * Usado no refresh do login Google (que não tem senha) e no restore ao abrir o app.
 * O backend devolve o VM direto (Ok(vm)) reusando o mesmo token.
 */
export async function loginWithTokenHttp(token: string): Promise<BeeforSession> {
  const url = getBeeforLoginComTokenApi();
  logger.info(`HTTP loginComToken → ${url}`);

  // LoginComToken é [AllowAnonymous]. O middleware do backend só decripta o body
  // se houver header X-Encryption-Key — sem ele, aceita JSON puro. Mandamos puro.
  const response = await fetchKeepAlive(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/plain, */*',
    },
    body: JSON.stringify({ Token: token }),
  });

  if (response.status === 401 || response.status === 403) {
    throw new BeeforAuthError('Sessão Google expirada. Faça login novamente.', response.status);
  }
  if (!response.ok) {
    const txt = await response.text().catch(() => '');
    throw new BeeforApiError(
      `LoginComToken falhou ${response.status}: ${txt.slice(0, 200)}`,
      response.status,
      txt,
    );
  }

  const data = (await response.json()) as Record<string, unknown>;
  // Pode vir cru (VM) ou envelopado ({ value: vm }) — normaliza como no TrocarOrganizacao.
  const raw: Record<string, unknown> =
    (data?.token ? data : (data?.value as Record<string, unknown>)) ?? data ?? {};
  const session = sessionFromLoginResponse(raw);
  setCachedSession(session);
  googleToken = session.token;
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

async function loadGoogleTokenFromKeychain(): Promise<string | null> {
  try {
    const { getGoogleToken } = await import('../secureStorage');
    return await getGoogleToken();
  } catch (err) {
    logger.warn(
      `Falha ao ler token Google do keytar: ${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }
}

async function refreshSession(): Promise<BeeforSession | null> {
  if (!credentials) {
    const fromStore = await loadCredentialsFromKeychain();
    if (fromStore) credentials = fromStore;
  }
  // Sem senha (login Google) → tenta o JWT persistido via LoginComToken.
  if (!credentials && !googleToken) {
    googleToken = await loadGoogleTokenFromKeychain();
  }
  if (!credentials && !googleToken) return null;

  if (!pendingRefresh) {
    pendingRefresh = (async () => {
      try {
        const session = credentials
          ? await loginHttp(credentials.usuario, credentials.senha)
          : await loginWithTokenHttp(googleToken!);
        // Login/LoginComToken volta na org default. Se havia org selecionada manualmente,
        // re-aplica o token escopado pra manter a troca através de refreshes (TTL/401).
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

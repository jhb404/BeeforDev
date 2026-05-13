import { COIN2U_URL } from '../../shared/constants';
import { logger } from '../logger';
import { coin2uAuth } from './auth';

const COMMON_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  Origin: COIN2U_URL,
  Referer: `${COIN2U_URL}/`,
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
};

function buildHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    ...COMMON_HEADERS,
    ...extra,
    Cookie: coin2uAuth.cookieHeader(),
  };
  const tk = coin2uAuth.getTokenApi();
  if (tk) headers.Authorization = tk;
  return headers;
}

function toAbsoluteUrl(pathOrUrl: string): string {
  return pathOrUrl.startsWith('http') ? pathOrUrl : `${COIN2U_URL}${pathOrUrl}`;
}

async function retryOnAuthFailure(
  url: string,
  method: 'GET' | 'POST',
  initial: Response,
  doFetch: () => Promise<Response>,
): Promise<Response> {
  coin2uAuth.applySetCookie(initial.headers.get('set-cookie'));
  if (initial.status !== 401 && initial.status !== 302 && initial.status !== 403) {
    return initial;
  }
  const ageMs = Date.now() - (coin2uAuth.getLoggedAt() ?? 0);
  if (ageMs <= 5_000) {
    logger.warn(
      `coin2u: ${initial.status} on ${url} with fresh token (age=${Math.round(ageMs / 1000)}s) — not retrying to avoid loop`,
    );
    return initial;
  }
  logger.info(
    `coin2u: ${initial.status} on ${url} ${method} → re-login (age=${Math.round(ageMs / 1000)}s)`,
  );
  coin2uAuth.invalidate();
  await coin2uAuth.login();
  const retried = await doFetch();
  coin2uAuth.applySetCookie(retried.headers.get('set-cookie'));
  return retried;
}

export async function coin2uAuthedGet(pathOrUrl: string): Promise<Response> {
  await coin2uAuth.loadFromDisk();
  await coin2uAuth.ensureFresh();

  const url = toAbsoluteUrl(pathOrUrl);
  const doFetch = () => fetch(url, { method: 'GET', headers: buildHeaders(), redirect: 'manual' });
  const res = await doFetch();
  return retryOnAuthFailure(url, 'GET', res, doFetch);
}

export async function coin2uAuthedPost(pathOrUrl: string, payload: unknown): Promise<Response> {
  await coin2uAuth.loadFromDisk();
  await coin2uAuth.ensureFresh();

  const url = toAbsoluteUrl(pathOrUrl);
  const body = JSON.stringify(payload);
  const doFetch = () =>
    fetch(url, {
      method: 'POST',
      headers: buildHeaders({ 'Content-Type': 'application/json;charset=UTF-8' }),
      body,
      redirect: 'manual',
    });
  const res = await doFetch();
  return retryOnAuthFailure(url, 'POST', res, doFetch);
}

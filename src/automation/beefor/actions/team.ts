import type { Page } from 'playwright';
import { BEEFOR_URL, NAV_TIMEOUT_MS } from '../../../shared/constants';
import { logger } from '../../../main/logger';

const TEAM_LIST_URL_RE = /\/api\/Pessoa\/ListarTodas\b/i;
const TEAM_PRIMARY_ROUTE = '/pessoas';
const TEAM_FALLBACK_ROUTES = ['/equipe', '/equipes', '/people'];

export async function doFetchTeamMembers(page: Page): Promise<unknown[]> {
  // Backend exige x-encryption-key + body cifrado pelo SPA. Replay manual não
  // funciona, então deixamos o próprio SPA disparar a chamada e capturamos a
  // response via Playwright. Tentamos rotas conhecidas até alguma triggar.
  if (!page.url().startsWith(BEEFOR_URL)) {
    await page.goto(BEEFOR_URL, {
      waitUntil: 'domcontentloaded',
      timeout: NAV_TIMEOUT_MS,
    });
  }

  const tryCapture = async (
    trigger: () => Promise<unknown>,
    timeoutMs: number,
  ): Promise<unknown[] | null> => {
    const responsePromise = page
      .waitForResponse((r) => TEAM_LIST_URL_RE.test(r.url()) && r.request().method() === 'POST', {
        timeout: timeoutMs,
      })
      .catch(() => null);
    await trigger().catch(() => {});
    const response = await responsePromise;
    if (!response) return null;
    if (!response.ok()) {
      const txt = await response.text().catch(() => '');
      logger.warn(`Pessoa/ListarTodas ${response.status()}: ${txt.slice(0, 200)}`);
      return null;
    }
    try {
      const json = await response.json();
      if (Array.isArray(json)) return json as unknown[];
      if (json && typeof json === 'object') {
        const obj = json as Record<string, unknown>;
        for (const key of ['data', 'pessoas', 'lista', 'items']) {
          if (Array.isArray(obj[key])) return obj[key] as unknown[];
        }
      }
      return [];
    } catch {
      return null;
    }
  };

  const routes = [TEAM_PRIMARY_ROUTE, ...TEAM_FALLBACK_ROUTES];
  let lastSeenEmpty = false;
  for (const route of routes) {
    const target = `${BEEFOR_URL}${route}`;
    const captured = await tryCapture(async () => {
      await page.goto(target, {
        waitUntil: 'domcontentloaded',
        timeout: NAV_TIMEOUT_MS,
      });
    }, 12_000);
    if (captured && captured.length > 0) return captured;
    if (captured) lastSeenEmpty = true;
  }

  if (lastSeenEmpty) return [];
  throw new Error(
    'Não consegui capturar Pessoa/ListarTodas — abra Beefor manualmente em /pessoas e tente de novo.',
  );
}

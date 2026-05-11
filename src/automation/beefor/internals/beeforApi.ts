import type { Page } from 'playwright';
import { BEEFOR_URL, NAV_TIMEOUT_MS } from '../../../shared/constants';

export async function ensureBeeforOrigin(page: Page): Promise<void> {
  if (page.url().startsWith(BEEFOR_URL)) return;
  await page.goto(BEEFOR_URL, {
    waitUntil: 'domcontentloaded',
    timeout: NAV_TIMEOUT_MS,
  });
}

export async function beeforApiGet<T = unknown>(
  page: Page,
  url: string,
): Promise<T> {
  await ensureBeeforOrigin(page);
  return page.evaluate(async (u) => {
    const storage = (globalThis as any).localStorage;
    const user = JSON.parse(storage.getItem('user1') || '{}');
    const token = user?.token;
    if (!token) throw new Error('Token não encontrado.');
    const r = await fetch(u, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${token}`,
      },
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      throw new Error(`${r.status} ${u} ${txt.slice(0, 200)}`);
    }
    const txt = await r.text();
    if (!txt) return null as any;
    return JSON.parse(txt);
  }, url);
}

export async function getIdPessoa(page: Page): Promise<string> {
  await ensureBeeforOrigin(page);
  const id = await page.evaluate(() => {
    try {
      const raw = (globalThis as any).localStorage?.getItem('user1');
      if (!raw) return null;
      const data = JSON.parse(raw);
      return (
        data?.idPessoa ??
        data?.pessoa?.idPessoa ??
        data?.user?.idPessoa ??
        null
      );
    } catch {
      return null;
    }
  });
  if (!id || typeof id !== 'string') {
    throw new Error('Token user1 ausente ou idPessoa não encontrado.');
  }
  return id;
}

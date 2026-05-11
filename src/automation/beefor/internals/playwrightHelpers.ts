import type { Locator, Page } from 'playwright';
import { DEFAULT_TIMEOUT_MS } from '../../../shared/constants';

/** Try a list of selectors; return first visible Locator. */
export async function firstVisible(
  page: Page,
  selectors: readonly string[],
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Locator> {
  const deadline = Date.now() + timeoutMs;
  let lastErr: unknown;
  while (Date.now() < deadline) {
    for (const sel of selectors) {
      const loc = page.locator(sel).first();
      try {
        if (await loc.isVisible({ timeout: 500 })) return loc;
      } catch (err) {
        lastErr = err;
      }
    }
    await page.waitForTimeout(200);
  }
  throw new Error(
    `No visible element for selectors: ${selectors.join(' | ')} (${
      lastErr instanceof Error ? lastErr.message : ''
    })`,
  );
}

export async function clickByAnyText(
  page: Page,
  texts: readonly string[],
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const t of texts) {
      const btn = page.getByRole('button', { name: t, exact: false }).first();
      try {
        if (await btn.isVisible({ timeout: 500 })) {
          await btn.click();
          return;
        }
      } catch {
        /* try next */
      }
    }
    await page.waitForTimeout(200);
  }
  throw new Error(`No clickable button matching any of: ${texts.join(', ')}`);
}

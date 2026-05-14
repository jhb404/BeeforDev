import type { Locator, Page } from 'playwright';
import { DEFAULT_TIMEOUT_MS } from '../../../../shared/constants';
import { logger } from '../../../../main/logger';
import { Selectors } from '../../beeforSelectors';
import { firstVisible } from '../../internals/playwrightHelpers';
import { isLoggedIn } from '../session';
import { navigateTimesheet } from './navigate';

export async function doAutoLancamento(page: Page): Promise<void> {
  logger.info('Triggering Auto lançamento');
  await navigateTimesheet(page);
  if (!(await isLoggedIn(page, 3000))) {
    throw new Error('Sessão expirada. Reabra o app.');
  }

  const componentScope = page.locator(Selectors.autoLancamento.component).first();
  let target: Locator;

  if (await componentScope.count()) {
    target = componentScope.getByText(Selectors.autoLancamento.buttonByText, { exact: false });
  } else {
    target = page.getByRole('button', { name: Selectors.autoLancamento.buttonByText }).first();
  }

  try {
    await target.click({ timeout: DEFAULT_TIMEOUT_MS });
  } catch {
    const fallback = await firstVisible(page, Selectors.autoLancamento.buttonCss);
    await fallback.click();
  }

  logger.info('Auto lançamento clicked, waiting for persistence');

  // Wait for the save API response instead of networkidle (Beefor has long-poll/WS
  // connections that never go idle, so networkidle always falls through to the
  // 2.5s fixed wait — wasted time).
  try {
    await page.waitForResponse(
      (resp) => /\/(Save|Auto|Timesheet)/i.test(resp.url()) && resp.status() < 400,
      { timeout: 6000 },
    );
  } catch {
    logger.warn('Auto lançamento: response wait timeout, falling back to short fixed wait');
    await page.waitForTimeout(800);
  }

  logger.info('Auto lançamento persisted');
}

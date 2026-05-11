import type { Page } from 'playwright';
import {
  BEEFOR_LOGIN_URL,
  BEEFOR_URL,
  NAV_TIMEOUT_MS,
} from '../../../shared/constants';
import type { Credentials } from '../../../shared/types';
import { logger } from '../../../main/logger';
import { Selectors } from '../beeforSelectors';
import { clickByAnyText, firstVisible } from '../internals/playwrightHelpers';

export async function performLogin(
  page: Page,
  creds: Credentials,
): Promise<void> {
  logger.info('Navigating to Beefor login');
  await page.goto(BEEFOR_LOGIN_URL, {
    waitUntil: 'domcontentloaded',
    timeout: NAV_TIMEOUT_MS,
  });

  if (await isLoggedIn(page, 1500)) {
    logger.info('Already logged in - skipping login flow');
    return;
  }

  const emailInput = await firstVisible(page, Selectors.login.emailInput);
  await emailInput.click();
  await emailInput.fill(creds.email);
  logger.info('Email filled');

  try {
    await clickByAnyText(page, Selectors.login.nextButtonByText, 4000);
    logger.info('Clicked next button');
  } catch {
    logger.debug('No next button, assuming single-step form');
  }

  const passwordInput = await firstVisible(page, Selectors.login.passwordInput);
  await passwordInput.click();
  await passwordInput.fill(creds.password);
  logger.info('Password filled');

  await clickByAnyText(page, Selectors.login.submitButtonByText);
  logger.info('Submitted login');

  const ok = await waitForLoggedIn(page, NAV_TIMEOUT_MS);
  if (!ok) {
    throw new Error(
      'Login não confirmado. Verifique credenciais ou se há MFA/CAPTCHA - faça login manualmente uma vez.',
    );
  }
  logger.info('Login confirmed');
}

async function waitForLoggedIn(page: Page, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isLoggedIn(page, 500)) return true;
    if (!page.url().includes('/login')) {
      await page.waitForTimeout(500);
      if (await isLoggedIn(page, 1500)) return true;
    }
    await page.waitForTimeout(300);
  }
  return false;
}

export async function isLoggedIn(page: Page, timeoutMs = 5000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const sel of Selectors.app.loggedInIndicators) {
      try {
        if (await page.locator(sel).first().isVisible({ timeout: 300 })) {
          return true;
        }
      } catch {
        /* ignore */
      }
    }
    if (page.url().includes('/login')) return false;
    await page.waitForTimeout(200);
  }
  return false;
}

export async function doVerifySession(page: Page): Promise<boolean> {
  await page.goto(BEEFOR_URL, {
    waitUntil: 'domcontentloaded',
    timeout: NAV_TIMEOUT_MS,
  });
  return isLoggedIn(page, 8000);
}

export async function doLogout(page: Page): Promise<void> {
  try {
    for (const sel of Selectors.app.userMenu) {
      const menu = page.locator(sel).first();
      if (await menu.isVisible({ timeout: 500 }).catch(() => false)) {
        await menu.click();
        break;
      }
    }
    await clickByAnyText(page, Selectors.app.logoutButtonByText, 5000);
    logger.info('Logout clicked');
  } catch (err) {
    logger.warn(
      `Logout via UI failed; clearing session anyway: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

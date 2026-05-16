import type { Locator, Page } from 'playwright';
import {
  BEEFOR_URL,
  BEEFOR_HOME_API,
  DEFAULT_TIMEOUT_MS,
  NAV_TIMEOUT_MS,
} from '../../../shared/constants';
import type { Mood } from '../../../shared/types/index';
import { logger } from '../../../main/logger';
import { Selectors } from '../beeforSelectors';
import { beeforApiGet, getIdPessoa } from '../internals/beeforApi';
import { canonicalMood } from '../internals/textUtils';
import { isLoggedIn } from './session';

export async function doSelectMood(page: Page, mood: Mood): Promise<void> {
  logger.info(`Selecting mood: ${mood}`);
  await ensureMoodVisible(page);

  const primary = page.locator(Selectors.mood.toggleByText(mood)).first();
  if (await isMoodSelected(primary)) {
    logger.info(`Mood "${mood}" already selected - skipping click`);
    return;
  }
  try {
    await primary.click({ timeout: 8000 });
    await page.waitForTimeout(350);
    if (await isMoodSelected(primary)) {
      logger.info('Mood selected (primary selector)');
      return;
    }
    logger.warn('Primary mood click completed but toggle did not become active');
  } catch {
    logger.warn('Primary mood selector failed, trying fallback');
  }

  const fallback = page.locator(Selectors.mood.fallbackButtonByText(mood)).first();
  if (await isMoodSelected(fallback)) {
    logger.info(`Mood "${mood}" already selected (fallback) - skipping click`);
    return;
  }
  await fallback.click({ timeout: DEFAULT_TIMEOUT_MS });
  logger.info('Mood selected (fallback selector)');
}

async function isMoodSelected(loc: Locator): Promise<boolean> {
  if (!(await loc.count())) return false;
  return isToggleActive(loc);
}

export async function doGetCurrentMood(page: Page): Promise<string | null> {
  logger.info('Get current mood: start');
  try {
    const apiMood = await doGetCurrentMoodViaApi(page);
    if (apiMood) {
      logger.info(`Current mood (API): ${apiMood}`);
      return apiMood;
    }
  } catch (err) {
    logger.warn(
      `Mood via API falhou, caindo para DOM: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  await ensureMoodVisible(page);

  const toggles = page.locator(Selectors.mood.allToggles);
  const n = await toggles.count();
  logger.info(`Get current mood: ${n} toggle(s) found`);
  if (n === 0) return null;

  const deadline = Date.now() + 3_500;
  while (Date.now() < deadline) {
    for (let i = 0; i < n; i++) {
      const t = toggles.nth(i);
      const cls = (await t.getAttribute('class').catch(() => '')) ?? '';
      const active = await isToggleActive(t);
      logger.debug(`mood toggle[${i}] class="${cls}" active=${active}`);
      if (!active) continue;

      const resolved = await getMoodFromToggle(t);
      if (resolved) {
        logger.info(`Current mood: ${resolved}`);
        return resolved;
      }
    }
    await page.waitForTimeout(250);
  }

  const group = page.locator(Selectors.mood.toggleGroup).first();
  const groupAttrs = await Promise.all([
    group.getAttribute('ng-reflect-value').catch(() => null),
    group.getAttribute('ng-reflect-model').catch(() => null),
    group.getAttribute('aria-label').catch(() => null),
  ]);
  for (const raw of groupAttrs) {
    const resolved = canonicalMood(raw);
    if (resolved) {
      logger.info(`Current mood (group attr): ${resolved}`);
      return resolved;
    }
  }

  logger.info('Get current mood: no active toggle');
  return null;
}

async function isToggleActive(loc: Locator): Promise<boolean> {
  try {
    const cls = (await loc.getAttribute('class').catch(() => '')) ?? '';
    if (/(?:^|\s)mat-button-toggle-checked(?:\s|$)/.test(cls)) return true;
    for (const suffix of Object.values(Selectors.mood.activeClassByMood)) {
      const re = new RegExp(`(?:^|\\s)${suffix}(?:\\s|$)`);
      if (re.test(cls)) return true;
    }
    const inner = loc.locator('button.mat-button-toggle-button').first();
    const hostChecked = await loc.getAttribute('aria-checked').catch(() => null);
    if (hostChecked === 'true') return true;

    const hostPressed = await loc.getAttribute('aria-pressed').catch(() => null);
    if (hostPressed === 'true') return true;

    const pressed = await inner.getAttribute('aria-pressed').catch(() => null);
    if (pressed === 'true') return true;

    const innerChecked = await inner.getAttribute('aria-checked').catch(() => null);
    if (innerChecked === 'true') return true;

    const innerClass = (await inner.getAttribute('class').catch(() => '')) ?? '';
    if (/(?:^|\s)mat-button-toggle-checked(?:\s|$)/.test(innerClass)) return true;

    return (
      (await loc
        .locator('input:checked')
        .count()
        .catch(() => 0)) > 0
    );
  } catch {
    return false;
  }
}

async function getMoodFromToggle(loc: Locator): Promise<Mood | null> {
  const svgIcon = await loc
    .locator('mat-icon')
    .first()
    .getAttribute('svgicon')
    .catch(() => null);
  if (svgIcon && Selectors.mood.svgIconToMood[svgIcon]) {
    return Selectors.mood.svgIconToMood[svgIcon] as Mood;
  }

  const button = loc.locator('button.mat-button-toggle-button').first();
  const candidates = await Promise.all([
    loc.innerText().catch(() => ''),
    loc.getAttribute('aria-label').catch(() => null),
    loc.getAttribute('title').catch(() => null),
    button.innerText().catch(() => ''),
    button.getAttribute('aria-label').catch(() => null),
    button.getAttribute('title').catch(() => null),
  ]);

  for (const raw of candidates) {
    const resolved = canonicalMood(raw);
    if (resolved) return resolved;
  }
  return null;
}

/**
 * Ensures the mood card (app-personal-mood-card) is rendered.
 * Mood card lives on the dashboard root, NOT on the timesheet page.
 */
async function ensureMoodVisible(page: Page): Promise<void> {
  const card = page.locator(Selectors.mood.component).first();
  if (await card.isVisible({ timeout: 1500 }).catch(() => false)) {
    await waitMoodHydrated(page);
    return;
  }

  await page.goto(BEEFOR_URL, {
    waitUntil: 'domcontentloaded',
    timeout: NAV_TIMEOUT_MS,
  });
  if (!(await isLoggedIn(page, 4000))) {
    throw new Error('Sessão expirada. Reabra o app.');
  }
  await card.waitFor({ state: 'visible', timeout: 10_000 });
  await waitMoodHydrated(page);
}

/**
 * Wait for the toggle group to actually have toggles inside (Angular hydration).
 * Without this we may inspect class lists before Angular applies the active class.
 */
async function waitMoodHydrated(page: Page): Promise<void> {
  await page
    .locator(Selectors.mood.allToggles)
    .first()
    .waitFor({ state: 'visible', timeout: 6000 })
    .catch(() => {});
  await page.waitForTimeout(400);
}

export async function doGetCurrentMoodViaApi(page: Page): Promise<Mood | null> {
  const idPessoa = await getIdPessoa(page);
  const url = `${BEEFOR_HOME_API}/InformaHumor?idPessoa=${idPessoa}`;
  const data = await beeforApiGet<any>(page, url);
  const sentimento = Number(data?.sentimento);
  if (!sentimento) return null;
  const map: Record<number, Mood> = {
    1: 'Dia feliz',
    2: 'Dia bom',
    3: 'Dia não tão bom',
    4: 'Dia triste',
  };
  return map[sentimento] ?? null;
}

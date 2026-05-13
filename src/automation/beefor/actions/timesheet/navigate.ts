import type { Page } from 'playwright';
import {
  BEEFOR_TIMESHEET_URL,
  DEFAULT_TIMEOUT_MS,
  NAV_TIMEOUT_MS,
} from '../../../../shared/constants';
import { Selectors } from '../../beeforSelectors';

/** Open mat-select then pick option by visible text. No-op if already selected. */
export async function pickMatSelect(
  page: Page,
  selectSel: string,
  optionText: string,
): Promise<void> {
  const sel = page.locator(selectSel).first();
  await sel.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT_MS });

  const currentText = (
    await sel
      .locator('.mat-select-value-text')
      .first()
      .innerText()
      .catch(() => '')
  ).trim();
  if (currentText === optionText) return;

  const trigger = sel.locator('.mat-select-trigger').first();
  await ((await trigger.count()) ? trigger : sel).click({
    timeout: DEFAULT_TIMEOUT_MS,
  });

  const optionsRoot = page.locator('.cdk-overlay-container mat-option');
  await optionsRoot.first().waitFor({ state: 'visible', timeout: 5000 });

  const opt = page.locator(`.cdk-overlay-container mat-option:has-text("${optionText}")`).first();
  await opt.click({ timeout: DEFAULT_TIMEOUT_MS });

  await optionsRoot
    .first()
    .waitFor({ state: 'detached', timeout: 4000 })
    .catch(() => {});
}

export async function navigateTimesheet(page: Page): Promise<void> {
  const onTimesheetUrl = page.url().includes('/time-sheet-beefor/lancamentos');
  const root = page.locator(Selectors.timesheet.pageRoot);
  if (onTimesheetUrl && (await root.isVisible({ timeout: 1500 }).catch(() => false))) {
    return;
  }

  await page.goto(BEEFOR_TIMESHEET_URL, {
    waitUntil: 'domcontentloaded',
    timeout: NAV_TIMEOUT_MS,
  });
  await page
    .locator(Selectors.timesheet.yearSelect)
    .first()
    .waitFor({ state: 'visible', timeout: NAV_TIMEOUT_MS });
}

import type { Locator, Page } from 'playwright';
import { DEFAULT_TIMEOUT_MS, NAV_TIMEOUT_MS } from '../../../../shared/constants';
import { Selectors } from '../../beeforSelectors';
import { MONTHS_PT, normalizeTimeForCompare, type PersistedRowValues } from './shared';
import { navigateTimesheet, pickMatSelect } from './navigate';

export async function setTextInputValue(input: Locator, value: string): Promise<void> {
  await input.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT_MS });
  await input.scrollIntoViewIfNeeded().catch(() => {});
  await input.click({ timeout: DEFAULT_TIMEOUT_MS, force: true });
  await input.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  if (value) {
    await input.pressSequentially(value, { delay: 8 });
  } else {
    await input.press('Backspace');
  }
  await input.blur().catch(() => {});

  const actual = await input.inputValue().catch(() => '');
  if (actual.trim() !== value.trim()) {
    throw new Error(`Falha ao preencher comentário: esperado "${value}", ficou "${actual}".`);
  }
}

export async function setTimeInputValue(input: Locator, value: string): Promise<void> {
  await input.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT_MS });
  await input.scrollIntoViewIfNeeded().catch(() => {});

  await input.click({ timeout: DEFAULT_TIMEOUT_MS, force: true });
  await input.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  if (value) {
    const typedValue = value.replace(/\D/g, '');
    if (typedValue.length !== 4) {
      throw new Error(`Horário inválido: ${value}`);
    }
    await input.pressSequentially(typedValue, { delay: 25 });
  } else {
    await input.press('Backspace');
  }
  await input.blur().catch(() => {});

  const actual = await input.inputValue().catch(() => '');
  if (normalizeTimeForCompare(actual) !== normalizeTimeForCompare(value)) {
    throw new Error(
      `Falha ao preencher horário: esperado ${value || '(vazio)'}, ficou ${actual || '(vazio)'}.`,
    );
  }
}

export async function readTimesheetRowValues(row: Locator): Promise<PersistedRowValues> {
  const inputs = row.locator(Selectors.timesheet.rowTimeInputs);
  const comentario = await row
    .locator(Selectors.timesheet.rowCommentInput)
    .first()
    .inputValue()
    .catch(() => '');

  return {
    entrada: await inputs
      .nth(0)
      .inputValue()
      .catch(() => ''),
    int1: await inputs
      .nth(1)
      .inputValue()
      .catch(() => ''),
    ret1: await inputs
      .nth(2)
      .inputValue()
      .catch(() => ''),
    int2: await inputs
      .nth(3)
      .inputValue()
      .catch(() => ''),
    ret2: await inputs
      .nth(4)
      .inputValue()
      .catch(() => ''),
    saida: await inputs
      .nth(5)
      .inputValue()
      .catch(() => ''),
    comentario,
  };
}

export async function readPersistedTimesheetRow(
  page: Page,
  year: number,
  month: number,
  dateLabel: string,
): Promise<PersistedRowValues> {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
  await navigateTimesheet(page);
  await pickMatSelect(page, Selectors.timesheet.yearSelect, String(year));
  await pickMatSelect(page, Selectors.timesheet.monthSelect, MONTHS_PT[month - 1]);

  const row = page.locator(Selectors.timesheet.dayRow).filter({ hasText: dateLabel }).first();
  await row.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT_MS });
  await page.waitForTimeout(500);

  return readTimesheetRowValues(row);
}

import type { Page } from 'playwright';
import { logger } from '../../../../main/logger';
import { Selectors } from '../../beeforSelectors';
import { isLoggedIn } from '../session';
import { MONTHS_PT, type FetchedRow } from './shared';
import { navigateTimesheet, pickMatSelect } from './navigate';
import { doFetchTimesheetViaApi } from './fetchApi';

export async function doFetchTimesheet(
  page: Page,
  year: number,
  month: number,
): Promise<FetchedRow[]> {
  logger.info(`Fetch timesheet: ${month}/${year}`);
  try {
    const rows = await doFetchTimesheetViaApi(page, year, month);
    logger.info(`Timesheet API: leitura de ${rows.length} dia(s) ${month}/${year}`);
    return rows;
  } catch (err) {
    logger.warn(
      `Fetch timesheet via API rápida falhou; tentando pela UI: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  await navigateTimesheet(page);
  if (!(await isLoggedIn(page, 3000))) {
    throw new Error('Sessão expirada na tela de Lançamentos. Reabra o app.');
  }

  await pickMatSelect(page, Selectors.timesheet.yearSelect, String(year));
  await pickMatSelect(page, Selectors.timesheet.monthSelect, MONTHS_PT[month - 1]);

  try {
    await page.locator(Selectors.timesheet.dayRow).first().waitFor({
      state: 'visible',
      timeout: 15_000,
    });
  } catch {
    logger.warn('Timesheet rows did not become visible within 15s');
    return [];
  }
  await page.waitForTimeout(300);

  const rows = await page.locator(Selectors.timesheet.dayRow).all();
  logger.info(`Timesheet: ${rows.length} linhas detectadas`);
  const out: FetchedRow[] = [];

  for (const row of rows) {
    try {
      const dateText = (await row.locator('.col-12.col-lg-1').first().innerText()).trim();
      const m = dateText.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (!m) continue;
      const [, dd, mm, yyyy] = m;
      const date = `${yyyy}-${mm}-${dd}`;

      const inputs = row.locator(Selectors.timesheet.rowTimeInputs);
      const inputCount = await inputs.count();
      const vals: string[] = [];
      let editable = true;
      for (let i = 0; i < Math.min(6, inputCount); i++) {
        const input = inputs.nth(i);
        const v = (await input.inputValue().catch(() => '')) ?? '';
        vals.push(v);
        if (await input.isDisabled().catch(() => false)) editable = false;
      }
      while (vals.length < 6) vals.push('');

      const cols = row.locator('.col-12.col-lg-1');
      const totalText = (await cols.nth(1).innerText().catch(() => '')).trim();
      const statusText = (await cols.nth(4).innerText().catch(() => '')).trim();

      const cmtInput = row.locator(Selectors.timesheet.rowCommentInput).first();
      const cmt = (await cmtInput.inputValue().catch(() => '')) ?? '';

      out.push({
        date,
        entrada: vals[0],
        int1: vals[1],
        ret1: vals[2],
        int2: vals[3],
        ret2: vals[4],
        saida: vals[5],
        total: totalText.replace(/[^\d:]/g, '') || '00:00',
        comentario: cmt,
        status: statusText,
        editable,
      });
    } catch (err) {
      logger.warn(
        `Falha ao ler linha do timesheet: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  logger.info(`Timesheet: leitura de ${out.length} dia(s) ${month}/${year}`);
  return out;
}

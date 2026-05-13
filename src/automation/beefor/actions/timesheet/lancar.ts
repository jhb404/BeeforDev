import type { Page } from 'playwright';
import { DEFAULT_TIMEOUT_MS } from '../../../../shared/constants';
import type { TimesheetEntry } from '../../../../shared/types';
import { logger } from '../../../../main/logger';
import { Selectors } from '../../beeforSelectors';
import { isLoggedIn } from '../session';
import {
  MONTHS_PT,
  TIME_KEYS,
  formatDateLabel,
  normalizeTimeForCompare,
  type PersistedRowValues,
  type TimeKey,
} from './shared';
import { navigateTimesheet, pickMatSelect } from './navigate';
import { extractSavedValues } from './payloadParse';
import {
  readPersistedTimesheetRow,
  readTimesheetRowValues,
  setTextInputValue,
  setTimeInputValue,
} from './rowIo';
import { waitForSaveResponses } from './saveResponse';
import { doLancarHoraViaApi } from './lancarApi';

export async function doLancarHora(
  page: Page,
  entry: TimesheetEntry,
): Promise<void> {
  logger.info(`Lançar hora: ${entry.date}`);
  try {
    await doLancarHoraViaApi(page, entry);
    logger.info(`Lançamento salvo via API rápida: ${formatDateLabel(entry.date)}`);
    return;
  } catch (err) {
    logger.warn(
      `Lançamento via API rápida falhou; tentando pela UI: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  await navigateTimesheet(page);
  if (!(await isLoggedIn(page, 3000))) {
    throw new Error('Sessão expirada. Reabra o app.');
  }

  const [y, m, d] = entry.date.split('-').map(Number);
  if (!y || !m || !d) throw new Error(`Data inválida: ${entry.date}`);

  await pickMatSelect(page, Selectors.timesheet.yearSelect, String(y));
  await pickMatSelect(page, Selectors.timesheet.monthSelect, MONTHS_PT[m - 1]);

  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const dateLabel = `${dd}/${mm}/${y}`;
  const row = page
    .locator(Selectors.timesheet.dayRow)
    .filter({ hasText: dateLabel })
    .first();

  await row.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT_MS });

  const inputs = row.locator(Selectors.timesheet.rowTimeInputs);
  const expected = TIME_KEYS;
  const values: Record<TimeKey, string> = {
    entrada: entry.entrada,
    int1: entry.int1,
    ret1: entry.ret1,
    int2: entry.int2,
    ret2: entry.ret2,
    saida: entry.saida,
  };

  const count = await inputs.count();
  if (count < 6) {
    throw new Error(
      `Linha de ${dateLabel} tem ${count} inputs (esperado 6). HTML do Beefor pode ter mudado.`,
    );
  }

  const before = await readTimesheetRowValues(row);
  for (let i = 0; i < 6; i++) {
    const key = expected[i];
    const v = values[key];
    if (normalizeTimeForCompare(before[key]) === normalizeTimeForCompare(v)) {
      continue;
    }
    const input = inputs.nth(i);
    if (await input.isDisabled().catch(() => false)) {
      throw new Error(`Campo ${key} está desabilitado no Beefor em ${dateLabel}.`);
    }
    await setTimeInputValue(input, v ?? '');
  }

  const commentChanged =
    entry.comentario !== undefined &&
    (before.comentario ?? '').trim() !== entry.comentario.trim();
  if (entry.comentario !== undefined) {
    const cmt = row.locator(Selectors.timesheet.rowCommentInput).first();
    if (await cmt.count()) {
      await setTextInputValue(cmt, entry.comentario);
    }
  }

  const save = row.locator(Selectors.timesheet.rowSaveButton).first();
  if (!(await save.isVisible({ timeout: 2500 }).catch(() => false))) {
    const current = await readTimesheetRowValues(row);
    const alreadyMatches = expected.every(
      (key) => normalizeTimeForCompare(current[key]) === normalizeTimeForCompare(values[key]),
    );
    const commentMatches =
      entry.comentario === undefined ||
      (current.comentario ?? '').trim() === entry.comentario.trim();
    if (alreadyMatches && commentMatches) {
      logger.info(`Linha de ${dateLabel} já estava com os valores informados`);
      return;
    }

    throw new Error(
      `Botão salvar não encontrado em ${dateLabel}. Confirme se a linha está editável.`,
    );
  }
  const saveResponse = waitForSaveResponses(page, commentChanged);
  await save.click();
  const payloads = await saveResponse;
  const payloadValues = extractSavedValues(payloads.main);
  const payloadComment = extractSavedValues(payloads.comment)?.comentario;
  if (payloadValues && payloadComment !== undefined) {
    payloadValues.comentario = payloadComment;
  }
  const hasCompletePayload =
    payloadValues &&
    expected.every((key) => payloadValues[key] !== undefined) &&
    (entry.comentario === undefined || payloadValues.comentario !== undefined);
  const persisted = hasCompletePayload
    ? (payloadValues as PersistedRowValues)
    : await readPersistedTimesheetRow(page, y, m, dateLabel);
  if (!hasCompletePayload) {
    logger.warn('Salvar lançamento: payload incompleto; conferência feita via reload');
  }
  const mismatches: string[] = expected.filter(
    (key) => normalizeTimeForCompare(persisted[key]) !== normalizeTimeForCompare(values[key]),
  );
  if (
    entry.comentario !== undefined &&
    (persisted.comentario ?? '').trim() !== entry.comentario.trim()
  ) {
    mismatches.push('comentario');
  }

  if (mismatches.length) {
    throw new Error(
      `Beefor não persistiu ${mismatches.join(', ')} em ${dateLabel}. ` +
        'Os campos foram preenchidos, mas a leitura após salvar voltou diferente.',
    );
  }
  logger.info(`Lançamento salvo: ${dateLabel}`);
}

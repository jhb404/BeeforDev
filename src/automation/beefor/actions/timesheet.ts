import type { Locator, Page } from 'playwright';
import {
  BEEFOR_TIMESHEET_URL,
  DEFAULT_TIMEOUT_MS,
  NAV_TIMEOUT_MS,
} from '../../../shared/constants';
import type { TimesheetEntry } from '../../../shared/types';
import { logger } from '../../../main/logger';
import { Selectors } from '../beeforSelectors';
import { firstVisible } from '../internals/playwrightHelpers';
import { ensureBeeforOrigin } from '../internals/beeforApi';
import {
  cacheMonthPayload,
  getCachedDayPayload,
  replaceCachedDayPayload,
} from '../internals/timesheetCache';
import { isLoggedIn } from './session';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const TIME_KEYS = ['entrada', 'int1', 'ret1', 'int2', 'ret2', 'saida'] as const;
type TimeKey = (typeof TIME_KEYS)[number];
type PersistedRowValues = Record<TimeKey | 'comentario', string>;

interface SavePayloads {
  main: unknown | null;
  comment: unknown | null;
}

export interface FetchedRow {
  date: string;
  entrada: string;
  int1: string;
  ret1: string;
  int2: string;
  ret2: string;
  saida: string;
  total: string;
  comentario: string;
  status: string;
  editable: boolean;
}

/** Open mat-select then pick option by visible text. No-op if already selected. */
async function pickMatSelect(
  page: Page,
  selectSel: string,
  optionText: string,
): Promise<void> {
  const sel = page.locator(selectSel).first();
  await sel.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT_MS });

  const currentText = (
    await sel.locator('.mat-select-value-text').first().innerText().catch(() => '')
  ).trim();
  if (currentText === optionText) return;

  const trigger = sel.locator('.mat-select-trigger').first();
  await ((await trigger.count()) ? trigger : sel).click({
    timeout: DEFAULT_TIMEOUT_MS,
  });

  const optionsRoot = page.locator('.cdk-overlay-container mat-option');
  await optionsRoot.first().waitFor({ state: 'visible', timeout: 5000 });

  const opt = page
    .locator(`.cdk-overlay-container mat-option:has-text("${optionText}")`)
    .first();
  await opt.click({ timeout: DEFAULT_TIMEOUT_MS });

  await optionsRoot
    .first()
    .waitFor({ state: 'detached', timeout: 4000 })
    .catch(() => {});
}

async function navigateTimesheet(page: Page): Promise<void> {
  const onTimesheetUrl = page.url().includes('/time-sheet-beefor/lancamentos');
  const root = page.locator(Selectors.timesheet.pageRoot);
  if (
    onTimesheetUrl &&
    (await root.isVisible({ timeout: 1500 }).catch(() => false))
  ) {
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

export async function doAutoLancamento(page: Page): Promise<void> {
  logger.info('Triggering Auto lançamento');
  await navigateTimesheet(page);
  if (!(await isLoggedIn(page, 3000))) {
    throw new Error('Sessão expirada. Reabra o app.');
  }

  const componentScope = page.locator(Selectors.autoLancamento.component).first();
  let target: Locator;

  if (await componentScope.count()) {
    target = componentScope.getByText(
      Selectors.autoLancamento.buttonByText,
      { exact: false },
    );
  } else {
    target = page
      .getByRole('button', { name: Selectors.autoLancamento.buttonByText })
      .first();
  }

  try {
    await target.click({ timeout: DEFAULT_TIMEOUT_MS });
  } catch {
    const fallback = await firstVisible(page, Selectors.autoLancamento.buttonCss);
    await fallback.click();
  }

  logger.info('Auto lançamento clicked, waiting for persistence');

  try {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch {
    logger.warn('Auto lançamento: networkidle timeout, falling back to fixed wait');
    await page.waitForTimeout(2500);
  }

  logger.info('Auto lançamento persisted');
}

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

async function doFetchTimesheetViaApi(
  page: Page,
  year: number,
  month: number,
): Promise<FetchedRow[]> {
  const payload = await fetchMonthPayloadViaApi(page, year, month);
  return parseFetchedRowsFromApi(payload);
}

async function fetchMonthPayloadViaApi(
  page: Page,
  year: number,
  month: number,
): Promise<any> {
  await ensureBeeforOrigin(page);
  const payload = await page.evaluate(
    async ({ year, month }) => {
      const endpoint =
        'https://apiteams.goobee.com.br/timesheet-beefor/api/apontamento';
      const storage = (globalThis as any).localStorage;
      const user = JSON.parse(storage.getItem('user1') || '{}');
      if (!user?.token) {
        throw new Error('Token do Beefor não encontrado no localStorage.');
      }
      const response = await fetch(`${endpoint}/${year}/${month}`, {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${user.token}`,
        },
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`GET apontamento ${response.status}: ${text.slice(0, 300)}`);
      }
      return JSON.parse(text);
    },
    { year, month },
  );
  cacheMonthPayload(year, month, payload);
  return payload;
}

function parseFetchedRowsFromApi(payload: unknown): FetchedRow[] {
  const root = asRecord(payload);
  const days = Array.isArray(root?.diasLancamento) ? root.diasLancamento : [];
  const rows: FetchedRow[] = [];

  for (const rawDay of days) {
    const day = asRecord(rawDay);
    if (!day) continue;
    const dia = Number(day.dia);
    const mes = Number(day.mes);
    const ano = Number(day.ano);
    if (!dia || !mes || !ano) continue;

    const apontamentos = Array.isArray(day.apontamentos) ? day.apontamentos : [];
    const vals = TIME_KEYS.map((_, index) => {
      const item =
        apontamentos.map(asRecord).find((ap) => ap?.index === index) ??
        asRecord(apontamentos[index]);
      return typeof item?.valor === 'string' ? item.valor : '';
    });

    rows.push({
      date: `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
      entrada: vals[0],
      int1: vals[1],
      ret1: vals[2],
      int2: vals[3],
      ret2: vals[4],
      saida: vals[5],
      total:
        typeof day.totalFormatado === 'string'
          ? day.totalFormatado.replace(/[^\d:]/g, '') || '00:00'
          : '00:00',
      comentario: typeof day.comentario === 'string' ? day.comentario : '',
      status:
        typeof day.situacaoFormatada === 'string'
          ? day.situacaoFormatada
          : day.feriado
          ? 'Feriado'
          : '',
      editable: true,
    });
  }

  return rows;
}

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

async function doLancarHoraViaApi(
  page: Page,
  entry: TimesheetEntry,
): Promise<void> {
  const [y, m, d] = entry.date.split('-').map(Number);
  if (!y || !m || !d) throw new Error(`Data inválida: ${entry.date}`);

  await ensureBeeforOrigin(page);

  const cachedRow = getCachedDayPayload(y, m, d);
  const apiResult = await page.evaluate(
    async ({ year, month, day, values, comentario, cachedRow }) => {
      const endpoint =
        'https://apiteams.goobee.com.br/timesheet-beefor/api/apontamento';
      const storage = (globalThis as any).localStorage;
      const user = JSON.parse(storage.getItem('user1') || '{}');
      if (!user?.token) {
        throw new Error('Token do Beefor não encontrado no localStorage.');
      }
      const authHeaders = {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${user.token}`,
      };
      let monthData = null;
      let row = cachedRow ? JSON.parse(JSON.stringify(cachedRow)) : null;
      if (!row) {
        const monthResponse = await fetch(`${endpoint}/${year}/${month}`, {
          headers: authHeaders,
        });
        const monthText = await monthResponse.text();
        if (!monthResponse.ok) {
          throw new Error(`GET apontamento ${monthResponse.status}: ${monthText.slice(0, 300)}`);
        }

        monthData = JSON.parse(monthText);
        row = monthData?.diasLancamento?.find(
          (item: any) => item?.dia === day && item?.mes === month && item?.ano === year,
        );
      }
      if (!row) throw new Error(`Dia ${day}/${month}/${year} não encontrado no apontamento.`);
      if (!Array.isArray(row.apontamentos) || row.apontamentos.length < 6) {
        throw new Error('Payload do Beefor sem os 6 apontamentos esperados.');
      }

      const keys = ['entrada', 'int1', 'ret1', 'int2', 'ret2', 'saida'] as const;
      keys.forEach((key, index) => {
        const apontamento =
          row.apontamentos.find((item: any) => item?.index === index) ??
          row.apontamentos[index];
        if (!apontamento) return;
        const next = values[key] || null;
        if ((apontamento.valor ?? null) !== next) {
          apontamento.valor = next;
          apontamento.manual = !!next;
        }
      });

      if (comentario !== undefined) {
        row.comentario = comentario;
      }

      const saveResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { ...authHeaders, 'content-type': 'application/json' },
        body: JSON.stringify(row),
      });
      const saveText = await saveResponse.text();
      if (!saveResponse.ok) {
        throw new Error(`POST apontamento ${saveResponse.status}: ${saveText.slice(0, 300)}`);
      }
      const saved = JSON.parse(saveText);
      let commentSaved = null;
      if (comentario !== undefined) {
        const commentPayload = { ...saved, comentario };
        const commentResponse = await fetch(`${endpoint}/comentario`, {
          method: 'POST',
          headers: { ...authHeaders, 'content-type': 'application/json' },
          body: JSON.stringify(commentPayload),
        });
        const commentText = await commentResponse.text();
        if (!commentResponse.ok) {
          throw new Error(
            `POST apontamento/comentario ${commentResponse.status}: ${commentText.slice(0, 300)}`,
          );
        }
        if (commentText) {
          try {
            commentSaved = JSON.parse(commentText);
          } catch {
            commentSaved = commentText;
          }
        }
      }

      return { saved, commentSaved, monthData };
    },
    {
      year: y,
      month: m,
      day: d,
      values: {
        entrada: entry.entrada,
        int1: entry.int1,
        ret1: entry.ret1,
        int2: entry.int2,
        ret2: entry.ret2,
        saida: entry.saida,
      },
      comentario: entry.comentario,
      cachedRow,
    },
  );
  if (apiResult.monthData) cacheMonthPayload(y, m, apiResult.monthData);
  const savedDay =
    extractDayPayload(apiResult.commentSaved) ??
    extractDayPayload(apiResult.saved) ??
    asRecord(apiResult.saved);
  const persisted = extractSavedValues(savedDay ?? apiResult.saved);
  const expected: Record<TimeKey, string> = {
    entrada: entry.entrada,
    int1: entry.int1,
    ret1: entry.ret1,
    int2: entry.int2,
    ret2: entry.ret2,
    saida: entry.saida,
  };
  const mismatches: string[] = TIME_KEYS.filter(
    (key) => normalizeTimeForCompare(persisted?.[key]) !== normalizeTimeForCompare(expected[key]),
  );
  if (
    entry.comentario !== undefined &&
    (persisted?.comentario ?? '').trim() !== entry.comentario.trim()
  ) {
    mismatches.push('comentario');
  }

  if (mismatches.length) {
    throw new Error(`API rápida não confirmou ${mismatches.join(', ')}.`);
  }

  replaceCachedDayPayload(y, m, d, savedDay ?? apiResult.saved);
}

async function setTextInputValue(input: Locator, value: string): Promise<void> {
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
    throw new Error(
      `Falha ao preencher comentário: esperado "${value}", ficou "${actual}".`,
    );
  }
}

async function setTimeInputValue(input: Locator, value: string): Promise<void> {
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
    throw new Error(`Falha ao preencher horário: esperado ${value || '(vazio)'}, ficou ${actual || '(vazio)'}.`);
  }
}

async function waitForSaveResponses(
  page: Page,
  expectCommentResponse: boolean,
): Promise<SavePayloads> {
  const main = waitForSaveEndpoint(page, '/timesheet-beefor/api/apontamento');
  let comment: Promise<unknown | null> = Promise.resolve(null);
  if (expectCommentResponse) {
    comment = waitForSaveEndpoint(
      page,
      '/timesheet-beefor/api/apontamento/comentario',
    );
  }
  const [mainPayload, commentPayload] = await Promise.all([main, comment]);
  return { main: mainPayload, comment: commentPayload };
}

async function waitForSaveEndpoint(
  page: Page,
  endpointPath: string,
): Promise<unknown | null> {
  const response = await page
    .waitForResponse(
      (response) => {
        const method = response.request().method();
        const pathname = new URL(response.url()).pathname;
        return ['POST', 'PUT', 'PATCH'].includes(method) && pathname === endpointPath;
      },
      { timeout: 15_000 },
    )
    .catch(() => {
      logger.warn(
        `Salvar lançamento: nenhuma resposta HTTP detectada para ${endpointPath}`,
      );
      return null;
    });

  if (!response) return null;

  const body = await response.text().catch(() => '');
  if (response.status() >= 400) {
    throw new Error(
      `Beefor recusou ${endpointPath} (${response.status()}): ${body.slice(0, 300)}`,
    );
  }
  if (!body) return null;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}

function extractSavedValues(payload: unknown): Partial<PersistedRowValues> | null {
  const day = extractDayPayload(payload);
  if (!day) return null;

  const out: Partial<PersistedRowValues> = {};
  if (typeof day.comentario === 'string') {
    out.comentario = day.comentario;
  }

  const apontamentos = Array.isArray(day.apontamentos) ? day.apontamentos : [];
  for (const raw of apontamentos) {
    const item = asRecord(raw);
    if (!item) continue;
    const index = typeof item?.index === 'number' ? item.index : -1;
    const key = TIME_KEYS[index];
    if (!key) continue;
    out[key] = typeof item.valor === 'string' ? item.valor : '';
  }

  return out;
}

function extractDayPayload(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) return null;
  if (Array.isArray(root.apontamentos)) return root;

  const diaApontamento = asRecord(root.diaApontamento);
  if (diaApontamento && Array.isArray(diaApontamento.apontamentos)) {
    return diaApontamento;
  }

  const stateMachine = asRecord(root.stateMachine);
  const stateDay = asRecord(stateMachine?.diaApontamento);
  if (stateDay && Array.isArray(stateDay.apontamentos)) {
    return stateDay;
  }

  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

async function readPersistedTimesheetRow(
  page: Page,
  year: number,
  month: number,
  dateLabel: string,
): Promise<PersistedRowValues> {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
  await navigateTimesheet(page);
  await pickMatSelect(page, Selectors.timesheet.yearSelect, String(year));
  await pickMatSelect(page, Selectors.timesheet.monthSelect, MONTHS_PT[month - 1]);

  const row = page
    .locator(Selectors.timesheet.dayRow)
    .filter({ hasText: dateLabel })
    .first();
  await row.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT_MS });
  await page.waitForTimeout(500);

  return readTimesheetRowValues(row);
}

function normalizeTimeForCompare(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function formatDateLabel(date: string): string {
  const [yyyy, mm, dd] = date.split('-');
  return yyyy && mm && dd ? `${dd}/${mm}/${yyyy}` : date;
}

async function readTimesheetRowValues(
  row: Locator,
): Promise<PersistedRowValues> {
  const inputs = row.locator(Selectors.timesheet.rowTimeInputs);
  const comentario = await row
    .locator(Selectors.timesheet.rowCommentInput)
    .first()
    .inputValue()
    .catch(() => '');

  return {
    entrada: await inputs.nth(0).inputValue().catch(() => ''),
    int1: await inputs.nth(1).inputValue().catch(() => ''),
    ret1: await inputs.nth(2).inputValue().catch(() => ''),
    int2: await inputs.nth(3).inputValue().catch(() => ''),
    ret2: await inputs.nth(4).inputValue().catch(() => ''),
    saida: await inputs.nth(5).inputValue().catch(() => ''),
    comentario,
  };
}

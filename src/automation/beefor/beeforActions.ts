import type { Locator, Page } from 'playwright';
import { Selectors } from './beeforSelectors';
import {
  BEEFOR_LOGIN_URL,
  BEEFOR_TIMESHEET_URL,
  BEEFOR_URL,
  DEFAULT_TIMEOUT_MS,
  NAV_TIMEOUT_MS,
} from '../../shared/constants';
import type {
  Credentials,
  Mood,
  SendKudoCardRequest,
  SendKudoCardResult,
  TimesheetEntry,
} from '../../shared/types';
import { logger } from '../../main/logger';

/** Try a list of selectors; return first visible Locator. */
async function firstVisible(
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

async function clickByAnyText(
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

export async function performLogin(
  page: Page,
  creds: Credentials,
): Promise<void> {
  logger.info('Navigating to Beefor login');
  await page.goto(BEEFOR_LOGIN_URL, {
    waitUntil: 'domcontentloaded',
    timeout: NAV_TIMEOUT_MS,
  });

  // already logged?
  if (await isLoggedIn(page, 1500)) {
    logger.info('Already logged in - skipping login flow');
    return;
  }

  const emailInput = await firstVisible(page, Selectors.login.emailInput);
  await emailInput.click();
  await emailInput.fill(creds.email);
  logger.info('Email filled');

  // some flows need an explicit "Avançar"; if not present, password may already render
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

  // wait for either an in-app indicator or URL change away from /login
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
      // navigated away; give the SPA a moment to render
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

export async function doAutoLancamento(page: Page): Promise<void> {
  logger.info('Triggering Auto lançamento');
  await navigateTimesheet(page);
  if (!(await isLoggedIn(page, 3000))) {
    throw new Error('Sessão expirada. Reabra o app.');
  }

  // prefer text-based locator scoped to component
  const componentScope = page.locator(Selectors.autoLancamento.component).first();
  let target: Locator;

  if (await componentScope.count()) {
    target = componentScope.getByText(
      Selectors.autoLancamento.buttonByText,
      { exact: false },
    );
  } else {
    // fallback: global text + css fallbacks
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

export async function doLogout(page: Page): Promise<void> {
  try {
    // open user menu if needed
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

const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const TIME_KEYS = ['entrada', 'int1', 'ret1', 'int2', 'ret2', 'saida'] as const;
type TimeKey = (typeof TIME_KEYS)[number];
type PersistedRowValues = Record<TimeKey | 'comentario', string>;

interface SavePayloads {
  main: unknown | null;
  comment: unknown | null;
}

const timesheetMonthCache = new Map<string, any>();

/** Open mat-select then pick option by visible text. No-op if already selected. */
async function pickMatSelect(
  page: Page,
  selectSel: string,
  optionText: string,
): Promise<void> {
  const sel = page.locator(selectSel).first();
  await sel.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT_MS });

  // already selected? mat-select renders the chosen text inside .mat-select-value-text
  const currentText = (
    await sel.locator('.mat-select-value-text').first().innerText().catch(() => '')
  ).trim();
  if (currentText === optionText) return;

  // Angular Material opens the dropdown when the trigger is clicked
  const trigger = sel.locator('.mat-select-trigger').first();
  await (await trigger.count() ? trigger : sel).click({
    timeout: DEFAULT_TIMEOUT_MS,
  });

  // Options render in cdk overlay (global). Wait for at least one to be visible.
  const optionsRoot = page.locator('.cdk-overlay-container mat-option');
  await optionsRoot.first().waitFor({ state: 'visible', timeout: 5000 });

  const opt = page
    .locator(`.cdk-overlay-container mat-option:has-text("${optionText}")`)
    .first();
  await opt.click({ timeout: DEFAULT_TIMEOUT_MS });

  // wait for panel to close
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
  // wait for the form-control mat-select to be present rather than the page-root
  // (some Beefor builds drop the host attribute selector once hydrated)
  await page
    .locator(Selectors.timesheet.yearSelect)
    .first()
    .waitFor({ state: 'visible', timeout: NAV_TIMEOUT_MS });
}

export interface FetchedRow {
  date: string;             // yyyy-mm-dd
  entrada: string;
  int1: string;
  ret1: string;
  int2: string;
  ret2: string;
  saida: string;
  total: string;            // "HH:MM"
  comentario: string;
  status: string;            // "Feriado" | "" | etc
  editable: boolean;         // false for weekends/holidays
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

  // pick year/month (no-op if already selected)
  await pickMatSelect(page, Selectors.timesheet.yearSelect, String(year));
  await pickMatSelect(page, Selectors.timesheet.monthSelect, MONTHS_PT[month - 1]);

  // wait for at least one row visible
  try {
    await page.locator(Selectors.timesheet.dayRow).first().waitFor({
      state: 'visible',
      timeout: 15_000,
    });
  } catch {
    logger.warn('Timesheet rows did not become visible within 15s');
    return [];
  }
  // small settle for SPA re-render after select
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

      // text-only columns in order: 0=Data, 1=Total, 2=Save, 3=Diff, 4=Status
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

async function ensureBeeforOrigin(page: Page): Promise<void> {
  if (page.url().startsWith(BEEFOR_URL)) return;
  await page.goto(BEEFOR_URL, {
    waitUntil: 'domcontentloaded',
    timeout: NAV_TIMEOUT_MS,
  });
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

function monthCacheKey(year: number, month: number): string {
  return `${year}-${month}`;
}

function cacheMonthPayload(year: number, month: number, payload: any): void {
  timesheetMonthCache.set(monthCacheKey(year, month), payload);
}

function getCachedDayPayload(year: number, month: number, day: number): any | null {
  const payload = timesheetMonthCache.get(monthCacheKey(year, month));
  const days = Array.isArray(payload?.diasLancamento) ? payload.diasLancamento : [];
  return (
    days.find(
      (item: any) => item?.dia === day && item?.mes === month && item?.ano === year,
    ) ?? null
  );
}

function replaceCachedDayPayload(
  year: number,
  month: number,
  day: number,
  savedDay: any,
): void {
  const payload = timesheetMonthCache.get(monthCacheKey(year, month));
  const days = Array.isArray(payload?.diasLancamento) ? payload.diasLancamento : null;
  if (!days) return;
  const index = days.findIndex(
    (item: any) => item?.dia === day && item?.mes === month && item?.ano === year,
  );
  if (index >= 0) days[index] = savedDay;
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
    // Beefor-specific: mood class suffix appears only when active
    for (const suffix of Object.values(Selectors.mood.activeClassByMood)) {
      const re = new RegExp(`(?:^|\\s)${suffix}(?:\\s|$)`);
      if (re.test(cls)) return true;
    }
    const inner = loc.locator('button.mat-button-toggle-button').first();
    const hostChecked = await loc
      .getAttribute('aria-checked')
      .catch(() => null);
    if (hostChecked === 'true') return true;

    const hostPressed = await loc
      .getAttribute('aria-pressed')
      .catch(() => null);
    if (hostPressed === 'true') return true;

    const pressed = await inner
      .getAttribute('aria-pressed')
      .catch(() => null);
    if (pressed === 'true') return true;

    const innerChecked = await inner
      .getAttribute('aria-checked')
      .catch(() => null);
    if (innerChecked === 'true') return true;

    const innerClass = (await inner.getAttribute('class').catch(() => '')) ?? '';
    if (/(?:^|\s)mat-button-toggle-checked(?:\s|$)/.test(innerClass)) return true;

    return (await loc.locator('input:checked').count().catch(() => 0)) > 0;
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

function canonicalMood(raw: string | null | undefined): Mood | null {
  const normalized = normalizeUiText(raw);
  if (!normalized) return null;

  const allMoods = Object.keys(Selectors.mood.activeClassByMood) as Mood[];
  for (const mood of allMoods) {
    if (normalizeUiText(mood) === normalized) return mood;
  }

  if (normalized.includes('feliz')) return 'Dia feliz';
  if (normalized.includes('nao tao bom') || normalized.includes('nao_tao_bom')) {
    return allMoods.find((m) => normalizeUiText(m).includes('nao')) ?? null;
  }
  if (normalized.includes('dia bom') || normalized === 'bom') return 'Dia bom';
  if (normalized.includes('triste')) return 'Dia triste';
  return null;
}

function normalizeUiText(raw: string | null | undefined): string {
  return (raw ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
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

  // entry.date = yyyy-mm-dd
  const [y, m, d] = entry.date.split('-').map(Number);
  if (!y || !m || !d) throw new Error(`Data inválida: ${entry.date}`);

  // Pick year + month
  await pickMatSelect(page, Selectors.timesheet.yearSelect, String(y));
  await pickMatSelect(page, Selectors.timesheet.monthSelect, MONTHS_PT[m - 1]);

  // Find the row whose first cell text matches dd/mm/yyyy
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

  // click save (floppy)
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

  // Beefor's Angular model only updates reliably when the native time input
  // receives real keyboard events. `fill()` changes the DOM but leaves
  // `apontamentos[index].valor` null for some fields (ex.: Ret. 1).
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
  // small settle so the active-state class is committed
  await page.waitForTimeout(400);
}

interface RecipientCacheEntry {
  expiresAt: number;
  items: Array<{ id: string; name: string; subtitle?: string }>;
}
const recipientCache = new Map<string, RecipientCacheEntry>();
const RECIPIENT_CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchRecipientList(
  page: Page,
  type: 'person' | 'team',
): Promise<Array<{ id: string; name: string; subtitle?: string }>> {
  const idPessoa = type === 'person' ? await getIdPessoa(page) : '';
  const cacheKey = `${type}:${idPessoa}`;
  const cached = recipientCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.items;

  const items = await page.evaluate(
    async ({ type, idPessoa }) => {
      const storage = (globalThis as any).localStorage;
      const user = JSON.parse(storage.getItem('user1') || '{}');
      const token = user?.token;
      if (!token) throw new Error('Token não encontrado.');

      const headers = {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${token}`,
      };

      const url =
        type === 'person'
          ? `https://apiteams.goobee.com.br/api/Pessoa/PegarPessoasUsuarioNaoInclusivo/${idPessoa}`
          : `https://apiteams.goobee.com.br/api/Pessoa/PegarTimesComboBox`;

      const r = await fetch(url, { headers });
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        throw new Error(`${r.status} ${url} ${txt.slice(0, 200)}`);
      }
      const json = await r.json();
      const arr = Array.isArray(json) ? json : [];
      return arr
        .map((it: any) => {
          const id = String(it?.id ?? it?.idPessoa ?? it?.idTime ?? '').trim();
          const name = String(it?.nome ?? it?.name ?? '').trim();
          const email = String(it?.email ?? '').trim();
          return { id, name, subtitle: email || undefined };
        })
        .filter((it: any) => it.name);
    },
    { type, idPessoa },
  );

  recipientCache.set(cacheKey, {
    expiresAt: Date.now() + RECIPIENT_CACHE_TTL_MS,
    items,
  });
  return items;
}

async function ensureKudoModalOpen(page: Page): Promise<Locator> {
  const dialog = page.locator(Selectors.kudoCard.dialog).filter({
    hasText: Selectors.kudoCard.dialogTitleText,
  }).first();

  if (await dialog.isVisible({ timeout: 800 }).catch(() => false)) {
    return dialog;
  }

  const idPessoa = await getIdPessoa(page);
  const profileUrl = `${BEEFOR_URL}/perfil/${idPessoa}`;
  if (!page.url().startsWith(profileUrl)) {
    await page.goto(profileUrl, {
      waitUntil: 'domcontentloaded',
      timeout: NAV_TIMEOUT_MS,
    });
  }
  if (!(await isLoggedIn(page, 5000))) {
    throw new Error('Sessão expirada.');
  }

  const addBtn = await firstVisible(
    page,
    [
      Selectors.kudoCard.addButtonByIcon,
      ...Selectors.kudoCard.addButtonAria,
    ] as readonly string[],
    12_000,
  );
  await addBtn.click({ timeout: DEFAULT_TIMEOUT_MS });

  await dialog.waitFor({ state: 'visible', timeout: 10_000 });
  return dialog;
}

export async function doSearchKudoRecipient(
  page: Page,
  type: 'person' | 'team',
  query: string,
): Promise<Array<{ id: string; name: string; subtitle?: string }>> {
  const q = (query ?? '').trim();
  if (q.length < 2) return [];

  await ensureBeeforOrigin(page);
  if (!(await isLoggedIn(page, 4000))) {
    throw new Error('Sessão expirada.');
  }

  const all = await fetchRecipientList(page, type);
  const needle = normalizeUiText(q);
  const filtered = all
    .filter((it) => normalizeUiText(it.name).includes(needle))
    .sort((a, b) => {
      const an = normalizeUiText(a.name);
      const bn = normalizeUiText(b.name);
      const ai = an.indexOf(needle);
      const bi = bn.indexOf(needle);
      if (ai !== bi) return ai - bi;
      return an.localeCompare(bn);
    })
    .slice(0, 15);
  return filtered;
}

async function beeforApiGet<T = unknown>(
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

export async function doFetchKudoCounts(
  page: Page,
): Promise<{ enviados: number; recebidos: number }> {
  const idPessoa = await getIdPessoa(page);
  const url = `https://apiteams.goobee.com.br/api/KudoCard/RecebidosEnviadosPessoa?idPessoa=${idPessoa}`;
  const data = await beeforApiGet<any>(page, url);
  return {
    enviados: Number(data?.enviados ?? 0),
    recebidos: Number(data?.recebidos ?? 0),
  };
}

export async function doFetchKudoLists(page: Page): Promise<{
  enviados: any[];
  recebidos: any[];
}> {
  const idPessoa = await getIdPessoa(page);
  const url = `https://apiteams.goobee.com.br/api/KudoCard/ListaRecebidosEnviadosPessoa?idPessoa=${idPessoa}`;
  const data = await beeforApiGet<any>(page, url);
  return {
    enviados: Array.isArray(data?.enviados) ? data.enviados : [],
    recebidos: Array.isArray(data?.recebidos) ? data.recebidos : [],
  };
}

export async function doFetchKudoDetail(page: Page, id: string): Promise<any> {
  if (!id) throw new Error('id obrigatório.');
  const url = `https://apiteams.goobee.com.br/api/KudoCard/Buscar/${encodeURIComponent(id)}`;
  return beeforApiGet<any>(page, url);
}

export async function doGetCurrentMoodViaApi(
  page: Page,
): Promise<Mood | null> {
  const idPessoa = await getIdPessoa(page);
  const url = `https://apiteams.goobee.com.br/api/Home/InformaHumor?idPessoa=${idPessoa}`;
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

async function getIdPessoa(page: Page): Promise<string> {
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

export async function doSendKudoCard(
  page: Page,
  req: SendKudoCardRequest,
): Promise<SendKudoCardResult> {
  if (!req.recipientName?.trim()) {
    throw new Error('Nome do destinatário vazio.');
  }
  if (!req.message?.trim()) {
    throw new Error('Mensagem vazia.');
  }
  logger.info(
    `KudoCard: enviar (${req.recipientType}) card=${req.cardType} destinatario="${req.recipientName}"`,
  );

  if (!(await isLoggedIn(page, 4000))) {
    throw new Error('Beefor não logado. Conecte a sessão antes.');
  }

  const dialog = await ensureKudoModalOpen(page).catch((err) => {
    throw new Error(
      err instanceof Error
        ? err.message
        : 'Modal "Enviar Kudo Card" não abriu.',
    );
  });

  // pick card image by src
  const cardImg = dialog.locator(Selectors.kudoCard.cardImageBySrc(req.cardType)).first();
  try {
    await cardImg.waitFor({ state: 'visible', timeout: 5000 });
    await cardImg.click({ timeout: DEFAULT_TIMEOUT_MS });
  } catch {
    throw new Error(`Card "${req.cardType}" não encontrado no modal.`);
  }

  // pick radio
  const radioLabel =
    req.recipientType === 'person'
      ? Selectors.kudoCard.radioPerson
      : Selectors.kudoCard.radioTeam;
  try {
    const radio = dialog.getByText(radioLabel, { exact: false }).first();
    await radio.click({ timeout: DEFAULT_TIMEOUT_MS });
  } catch {
    throw new Error(`Radio "${radioLabel}" não encontrado.`);
  }

  // fill autocomplete
  const acInput = dialog.locator(Selectors.kudoCard.autocompleteInput).first();
  try {
    await acInput.waitFor({ state: 'visible', timeout: 8000 });
    await acInput.click({ timeout: DEFAULT_TIMEOUT_MS, force: true });
    await acInput.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await acInput.pressSequentially(req.recipientName.trim(), { delay: 30 });
  } catch {
    throw new Error('Campo autocomplete não disponível.');
  }

  // wait + click matching option
  const optionsRoot = page.locator(Selectors.kudoCard.autocompleteOption);
  try {
    await optionsRoot.first().waitFor({ state: 'visible', timeout: 6000 });
  } catch {
    throw new Error(`Nenhum resultado para "${req.recipientName}" no autocomplete.`);
  }
  const target = req.recipientName.trim();
  const exact = page
    .locator(Selectors.kudoCard.autocompleteOption)
    .filter({ hasText: new RegExp(`^\\s*${escapeRegex(target)}\\s*$`, 'i') })
    .first();
  let chosen = exact;
  if (!(await exact.isVisible({ timeout: 800 }).catch(() => false))) {
    chosen = page
      .locator(Selectors.kudoCard.autocompleteOption)
      .filter({ hasText: new RegExp(escapeRegex(target), 'i') })
      .first();
  }
  if (!(await chosen.isVisible({ timeout: 1500 }).catch(() => false))) {
    throw new Error(`Pessoa/time "${target}" não encontrado no autocomplete.`);
  }
  await chosen.click({ timeout: DEFAULT_TIMEOUT_MS });

  // fill message
  const textarea = dialog.locator(Selectors.kudoCard.messageTextarea).first();
  try {
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.click({ timeout: DEFAULT_TIMEOUT_MS, force: true });
    await textarea.fill(req.message.trim());
  } catch {
    throw new Error('Textarea de mensagem não disponível.');
  }

  // submit
  const sendBtn = dialog
    .getByRole('button', { name: Selectors.kudoCard.sendButtonText, exact: false })
    .first();
  if (!(await sendBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
    throw new Error('Botão Enviar não encontrado.');
  }

  const responsePromise = page
    .waitForResponse(
      (r) => /kudo/i.test(r.url()) && ['POST', 'PUT'].includes(r.request().method()),
      { timeout: 15_000 },
    )
    .catch(() => null);
  await sendBtn.click({ timeout: DEFAULT_TIMEOUT_MS });

  const response = await responsePromise;
  if (response && response.status() >= 400) {
    const body = await response.text().catch(() => '');
    throw new Error(`Beefor recusou envio (${response.status()}): ${body.slice(0, 200)}`);
  }

  // wait dialog close as confirmation
  await dialog
    .waitFor({ state: 'detached', timeout: 8000 })
    .catch(() => {});

  logger.info('KudoCard enviado com sucesso');
  return { success: true, message: 'KudoCard enviado.' };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const TEAM_LIST_URL_RE = /\/api\/Pessoa\/ListarTodas\b/i;
const TEAM_PRIMARY_ROUTE = '/pessoas';
const TEAM_FALLBACK_ROUTES = ['/equipe', '/equipes', '/people'];

export async function doFetchTeamMembers(page: Page): Promise<unknown[]> {
  // Backend exige x-encryption-key + body cifrado pelo SPA. Replay manual não
  // funciona, então deixamos o próprio SPA disparar a chamada e capturamos a
  // response via Playwright. Tentamos rotas conhecidas até alguma triggar.
  if (!page.url().startsWith(BEEFOR_URL)) {
    await page.goto(BEEFOR_URL, {
      waitUntil: 'domcontentloaded',
      timeout: NAV_TIMEOUT_MS,
    });
  }

  const tryCapture = async (
    trigger: () => Promise<unknown>,
    timeoutMs: number,
  ): Promise<unknown[] | null> => {
    const responsePromise = page
      .waitForResponse(
        (r) => TEAM_LIST_URL_RE.test(r.url()) && r.request().method() === 'POST',
        { timeout: timeoutMs },
      )
      .catch(() => null);
    await trigger().catch(() => {});
    const response = await responsePromise;
    if (!response) return null;
    if (!response.ok()) {
      const txt = await response.text().catch(() => '');
      logger.warn(
        `Pessoa/ListarTodas ${response.status()}: ${txt.slice(0, 200)}`,
      );
      return null;
    }
    try {
      const json = await response.json();
      if (Array.isArray(json)) return json as unknown[];
      if (json && typeof json === 'object') {
        const obj = json as Record<string, unknown>;
        for (const key of ['data', 'pessoas', 'lista', 'items']) {
          if (Array.isArray(obj[key])) return obj[key] as unknown[];
        }
      }
      return [];
    } catch {
      return null;
    }
  };

  const routes = [TEAM_PRIMARY_ROUTE, ...TEAM_FALLBACK_ROUTES];
  let lastSeenEmpty = false;
  for (const route of routes) {
    const target = `${BEEFOR_URL}${route}`;
    const captured = await tryCapture(
      async () => {
        await page.goto(target, {
          waitUntil: 'domcontentloaded',
          timeout: NAV_TIMEOUT_MS,
        });
      },
      12_000,
    );
    if (captured && captured.length > 0) return captured;
    if (captured) lastSeenEmpty = true;
  }

  if (lastSeenEmpty) return [];
  throw new Error(
    'Não consegui capturar Pessoa/ListarTodas — abra Beefor manualmente em /pessoas e tente de novo.',
  );
}

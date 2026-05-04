import type { Locator, Page } from 'playwright';
import { Selectors } from './beeforSelectors';
import {
  BEEFOR_LOGIN_URL,
  BEEFOR_TIMESHEET_URL,
  BEEFOR_URL,
  DEFAULT_TIMEOUT_MS,
  NAV_TIMEOUT_MS,
} from '../../shared/constants';
import type { Credentials, Mood, TimesheetEntry } from '../../shared/types';
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
      'Login não confirmado. Verifique credenciais ou se há MFA/CAPTCHA — faça login manualmente uma vez.',
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
  await ensureOnApp(page);

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

  logger.info('Auto lançamento clicked');
}

export async function doSelectMood(page: Page, mood: Mood): Promise<void> {
  logger.info(`Selecting mood: ${mood}`);
  await ensureOnApp(page);

  const primary = page.locator(Selectors.mood.toggleByText(mood)).first();
  if (await isMoodSelected(primary)) {
    logger.info(`Mood "${mood}" already selected — skipping click`);
    return;
  }
  try {
    await primary.click({ timeout: 8000 });
    logger.info('Mood selected (primary selector)');
    return;
  } catch {
    logger.warn('Primary mood selector failed, trying fallback');
  }

  const fallback = page.locator(Selectors.mood.fallbackButtonByText(mood)).first();
  if (await isMoodSelected(fallback)) {
    logger.info(`Mood "${mood}" already selected (fallback) — skipping click`);
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

export async function doGetCurrentMood(page: Page): Promise<string | null> {
  await ensureOnApp(page);

  const toggles = page.locator(Selectors.mood.allToggles);
  const n = await toggles.count();
  if (n === 0) return null;

  for (let i = 0; i < n; i++) {
    const t = toggles.nth(i);
    if (await isToggleActive(t)) {
      // try svgicon → mood mapping (most reliable)
      const svgIcon = await t
        .locator('mat-icon')
        .first()
        .getAttribute('svgicon')
        .catch(() => null);
      if (svgIcon && Selectors.mood.svgIconToMood[svgIcon]) {
        return Selectors.mood.svgIconToMood[svgIcon];
      }
      const label = (await t.innerText().catch(() => '')).trim();
      return label || null;
    }
  }
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
    const pressed = await inner
      .getAttribute('aria-pressed')
      .catch(() => null);
    return pressed === 'true';
  } catch {
    return false;
  }
}

export async function doLancarHora(
  page: Page,
  entry: TimesheetEntry,
): Promise<void> {
  logger.info(`Lançar hora: ${entry.date}`);
  await navigateTimesheet(page);
  if (!(await isLoggedIn(page, 3000))) {
    throw new Error('Sessão expirada. Reabra o app.');
  }
  await navigateTimesheet(page);

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
  const expected = ['entrada', 'int1', 'ret1', 'int2', 'ret2', 'saida'] as const;
  const values: Record<(typeof expected)[number], string> = {
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

  for (let i = 0; i < 6; i++) {
    const v = values[expected[i]];
    const input = inputs.nth(i);
    if (await input.isDisabled().catch(() => false)) {
      if (v) {
        logger.warn(`Campo ${expected[i]} desabilitado em ${dateLabel} — pulando`);
      }
      continue;
    }
    await input.fill(v ?? '');
  }

  if (entry.comentario !== undefined) {
    const cmt = row.locator(Selectors.timesheet.rowCommentInput).first();
    if (await cmt.count()) {
      await cmt.fill(entry.comentario);
    }
  }

  // click save (floppy)
  const save = row.locator(Selectors.timesheet.rowSaveButton).first();
  if (!(await save.count())) {
    throw new Error(
      `Botão salvar não encontrado em ${dateLabel}. Confirme se a linha está editável.`,
    );
  }
  await save.click();
  logger.info(`Lançamento salvo: ${dateLabel}`);
}

async function ensureOnApp(page: Page): Promise<void> {
  if (!page.url().startsWith(BEEFOR_URL)) {
    await page.goto(BEEFOR_URL, {
      waitUntil: 'domcontentloaded',
      timeout: NAV_TIMEOUT_MS,
    });
  }
  if (!(await isLoggedIn(page, 4000))) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }
}

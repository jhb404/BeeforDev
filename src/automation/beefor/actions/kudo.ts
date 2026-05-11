import type { Locator, Page } from 'playwright';
import {
  BEEFOR_URL,
  DEFAULT_TIMEOUT_MS,
  NAV_TIMEOUT_MS,
} from '../../../shared/constants';
import type {
  SendKudoCardRequest,
  SendKudoCardResult,
} from '../../../shared/types';
import { logger } from '../../../main/logger';
import { Selectors } from '../beeforSelectors';
import { firstVisible } from '../internals/playwrightHelpers';
import { beeforApiGet, ensureBeeforOrigin, getIdPessoa } from '../internals/beeforApi';
import { escapeRegex, normalizeUiText } from '../internals/textUtils';
import { isLoggedIn } from './session';

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
  const dialog = page
    .locator(Selectors.kudoCard.dialog)
    .filter({ hasText: Selectors.kudoCard.dialogTitleText })
    .first();

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

export async function doFetchKudoLists(
  page: Page,
): Promise<{ enviados: any[]; recebidos: any[] }> {
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

  const cardImg = dialog.locator(Selectors.kudoCard.cardImageBySrc(req.cardType)).first();
  try {
    await cardImg.waitFor({ state: 'visible', timeout: 5000 });
    await cardImg.click({ timeout: DEFAULT_TIMEOUT_MS });
  } catch {
    throw new Error(`Card "${req.cardType}" não encontrado no modal.`);
  }

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

  const acInput = dialog.locator(Selectors.kudoCard.autocompleteInput).first();
  try {
    await acInput.waitFor({ state: 'visible', timeout: 8000 });
    await acInput.click({ timeout: DEFAULT_TIMEOUT_MS, force: true });
    await acInput.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await acInput.pressSequentially(req.recipientName.trim(), { delay: 30 });
  } catch {
    throw new Error('Campo autocomplete não disponível.');
  }

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

  const textarea = dialog.locator(Selectors.kudoCard.messageTextarea).first();
  try {
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.click({ timeout: DEFAULT_TIMEOUT_MS, force: true });
    await textarea.fill(req.message.trim());
  } catch {
    throw new Error('Textarea de mensagem não disponível.');
  }

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

  await dialog.waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});

  logger.info('KudoCard enviado com sucesso');
  return { success: true, message: 'KudoCard enviado.' };
}

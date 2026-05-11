import { COIN2U_DASHBOARD_URL } from '../../shared/constants';
import type {
  Coin2uBuyItemRequest,
  Coin2uDashboard,
  Coin2uLog,
  Coin2uShop,
  Coin2uTransferRequest,
} from '../../shared/types';
import { logger } from '../logger';
import { coin2uAuth } from './auth';
import { coin2uAuthedGet, coin2uAuthedPost } from './http';
import { parseMembers, parseShopItems, parseTransactions } from './parsers';

async function requireUserId(fallback?: number): Promise<number> {
  await coin2uAuth.loadFromDisk();
  await coin2uAuth.ensureFresh();
  const userId = coin2uAuth.getUserId() ?? fallback;
  if (!userId) throw new Error('Coin2U: userId indisponível (faça login)');
  return userId;
}

function requireToken(): string {
  const token = coin2uAuth.getTokenApi();
  if (!token) throw new Error('Coin2U: token indisponível (faça login)');
  return token;
}

export async function getCoin2uDashboard(
  fallbackUserId?: number,
): Promise<Coin2uDashboard> {
  const userId = await requireUserId(fallbackUserId);
  const token = requireToken();

  const url = `${COIN2U_DASHBOARD_URL}?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
  const res = await coin2uAuthedGet(url);
  if (res.status >= 400) throw new Error(`Coin2U dashboard HTTP ${res.status}`);

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Coin2U dashboard: resposta inválida (não-JSON)');
  }

  return {
    Coins: Number(json.Coins ?? 0),
    CurrentQuotation: Number(json.CurrentQuotation ?? 0),
    DaysToExpire: Number(json.DaysToExpire ?? 0),
    ExchangeCoins: Number(json.ExchangeCoins ?? 0),
    Members: parseMembers(json.Members),
    RecentTransactions: parseTransactions(
      json.RecentTransactions ?? json.Transactions ?? json.Log ?? json.LastTransactions,
    ),
  };
}

export async function getCoin2uLog(fallbackUserId?: number): Promise<Coin2uLog> {
  const userId = await requireUserId(fallbackUserId);
  const token = requireToken();

  const url = `/VentronCoins/GetLog?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
  const res = await coin2uAuthedGet(url);
  if (res.status >= 400) throw new Error(`Coin2U log HTTP ${res.status}`);

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Coin2U log: resposta inválida (não-JSON)');
  }
  return { Log: parseTransactions(json.Log ?? json.log) };
}

export async function getCoin2uShop(
  fallbackUserId?: number,
  fallbackInfo?: Record<string, unknown>,
): Promise<Coin2uShop> {
  const userId = await requireUserId(fallbackUserId);
  const token = coin2uAuth.getTokenApi();
  const info = coin2uAuth.getInfo() ?? fallbackInfo ?? null;
  const organizationId = Number(
    info?.OrganizationId ?? info?.organizationId ?? info?.OrgId ?? info?.orgId ?? 0,
  );
  if (!organizationId) throw new Error('Coin2U: organizationId indisponível (faça login)');

  const url = `/VentronCoins/GetShop?organizationId=${encodeURIComponent(organizationId)}&userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token ?? '')}`;
  const res = await coin2uAuthedGet(url);
  if (res.status >= 400) throw new Error(`Coin2U shop HTTP ${res.status}`);

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Coin2U shop: resposta inválida (não-JSON)');
  }

  return {
    Coins: Number(json.Coins ?? 0),
    ShopItems: parseShopItems(json.ShopItems ?? json.shopItems ?? json.Items ?? json.items),
  };
}

export async function buyCoin2uItem(
  req: Coin2uBuyItemRequest,
  fallbackUserId?: number,
): Promise<boolean> {
  const from = await requireUserId(fallbackUserId);
  if (!Number.isFinite(req.shopItemId) || req.shopItemId <= 0) throw new Error('Item inválido.');
  if (!Number.isFinite(req.price) || req.price <= 0) throw new Error('Preço inválido.');

  const url = `/VentronCoins/BuyItem?shopItemId=${encodeURIComponent(req.shopItemId)}&from=${encodeURIComponent(from)}&price=${encodeURIComponent(Math.floor(req.price))}&token=undefined`;
  const res = await coin2uAuthedGet(url);
  // TODO: Validar pq uma compra que deu sucesso no COIN2U retorna um raios de HTTP 500
  if (res.status === 500) return true;
  if (res.status >= 400) throw new Error(`Coin2U compra HTTP ${res.status}`);

  const text = (await res.text()).trim();
  const normalized = text.toLowerCase();
  if (normalized === '0' || normalized === 'false') return false;
  if (/login|isthereloginerror|unauthorized|não autorizado|nao autorizado/i.test(text)) {
    throw new Error('Coin2U compra recusada pela sessão.');
  }
  return true;
}

export async function transferCoin2uCoins(
  req: Coin2uTransferRequest,
  fallbackUserId?: number,
): Promise<boolean> {
  const from = await requireUserId(fallbackUserId);
  if (!Number.isFinite(req.To) || req.To <= 0) throw new Error('Escolha quem vai receber.');
  if (!Number.isFinite(req.Amount) || req.Amount <= 0) throw new Error('Informe uma quantia válida.');

  const res = await coin2uAuthedPost('/VentronCoins/TransferCoins', {
    transferCoins: {
      To: req.To,
      From: from,
      Amount: Math.floor(req.Amount),
      Message: req.Message ?? '',
    },
  });

  if (res.status >= 400) throw new Error(`Coin2U transfer HTTP ${res.status}`);
  const text = (await res.text()).trim().toLowerCase();
  return text === '1' || text === 'true';
}

/**
 * Fetches /User/GetOrgList. Returns [] on failure (best-effort cache; non-critical).
 */
export async function fetchCoin2uOrgs(): Promise<unknown[]> {
  await coin2uAuth.loadFromDisk();
  await coin2uAuth.ensureFresh();
  const userId = coin2uAuth.getUserId();
  if (!userId) return [];
  try {
    const res = await coin2uAuthedGet(`/User/GetOrgList?userId=${userId}`);
    if (res.status >= 400) return [];
    const text = await res.text();
    const json = JSON.parse(text);
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.Orgs)) return json.Orgs;
    return [];
  } catch (err) {
    logger.warn(`coin2u: fetch orgs failed: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

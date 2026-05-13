import type { Coin2uMember, Coin2uShopItem, Coin2uTransaction } from '../../shared/types';

export function parseMembers(value: unknown): Coin2uMember[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((m: any) => ({
      Value: Number(m?.Value ?? m?.value ?? 0),
      Text: String(m?.Text ?? m?.text ?? '').trim(),
    }))
    .filter((m) => Number.isFinite(m.Value) && m.Value > 0 && m.Text);
}

export function parseTransactions(value: unknown): Coin2uTransaction[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((t: any) => ({
      TransactionId: Number(t?.TransactionId ?? t?.transactionId ?? 0),
      Amount: Number(t?.Amount ?? t?.amount ?? t?.Coins ?? 0),
      FromName: String(t?.FromName ?? t?.fromName ?? ''),
      FromId: Number(t?.FromId ?? t?.fromId ?? 0),
      ToName: String(t?.ToName ?? t?.toName ?? ''),
      ToId: Number(t?.ToId ?? t?.toId ?? 0),
      Date: String(t?.Date ?? t?.date ?? ''),
      ShopItemId: t?.ShopItemId ?? null,
      ShopItemName: t?.ShopItemName ?? null,
      Coins: t?.Coins == null ? null : Number(t.Coins),
      Message: t?.Message ?? null,
      GenesisBookId: t?.GenesisBookId ?? null,
      ProviderId: t?.ProviderId ?? null,
      ProviderIdName: t?.ProviderIdName ?? null,
    }))
    .filter((t) => Number.isFinite(t.TransactionId) && t.TransactionId > 0);
}

export function parseShopItems(value: unknown): Coin2uShopItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any) => ({
      Id: Number(item?.Id ?? item?.id ?? 0),
      Name: String(item?.Name ?? item?.name ?? '').trim(),
      Imagem: item?.Imagem || item?.imagem || item?.Image || null,
      Price: Number(item?.Price ?? item?.price ?? 0),
      PriceInReal: Number(item?.PriceInReal ?? item?.priceInReal ?? 0),
      LastUpdate: item?.LastUpdate ?? item?.lastUpdate ?? null,
      Active: Boolean(item?.Active ?? item?.active ?? false),
      Stock: Number(item?.Stock ?? item?.stock ?? 0),
      Description: String(item?.Description ?? item?.description ?? '').trim(),
      PurchaseInstruction: item?.PurchaseInstruction ?? item?.purchaseInstruction ?? null,
      category: item?.category
        ? {
            Id: Number(item.category.Id ?? item.category.id ?? 0),
            Decription: String(item.category.Decription ?? item.category.Description ?? '').trim(),
            BitActive: item.category.BitActive,
          }
        : null,
    }))
    .filter((item) => Number.isFinite(item.Id) && item.Id > 0 && item.Name);
}

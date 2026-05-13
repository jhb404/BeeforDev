import { useCallback, useState } from 'react';
import type { Coin2uDashboard, Coin2uShopItem } from '@shared/types';
import { coin2uClient } from '../../../services/ipc';

interface UseCoin2uShopOptions {
  setDashboard: React.Dispatch<React.SetStateAction<Coin2uDashboard | null>>;
  setError: (err: string | null) => void;
}

interface UseCoin2uShopResult {
  shopItems: Coin2uShopItem[];
  shopLoading: boolean;
  refreshShop: (showLoading?: boolean) => Promise<void>;
}

export function useCoin2uShop({ setDashboard, setError }: UseCoin2uShopOptions): UseCoin2uShopResult {
  const [shopItems, setShopItems] = useState<Coin2uShopItem[]>([]);
  const [shopLoading, setShopLoading] = useState(false);

  const refreshShop = useCallback(
    async (showLoading = true) => {
      if (showLoading) setShopLoading(true);
      try {
        const res = await coin2uClient.getShop();
        if (!res.ok || !res.data) throw new Error(res.error ?? 'Falha ao carregar loja.');
        const shop = res.data;
        setShopItems(shop.ShopItems);
        setDashboard((prev) => (prev ? { ...prev, Coins: shop.Coins } : prev));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        if (showLoading) setShopLoading(false);
      }
    },
    [setDashboard, setError],
  );

  return { shopItems, shopLoading, refreshShop };
}

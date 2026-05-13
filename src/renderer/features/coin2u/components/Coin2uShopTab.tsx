import { useMemo, useState } from 'react';
import type { Coin2uDashboard, Coin2uShopItem } from '@shared/types';
import { Package, Search, ShoppingBag } from '../../../components/common/Icons';
import { CoinIcon } from './Coin2uCoinIcon';
import { formatReal, itemCategory, matchesShopItem } from '../utils/coin2uFormat';

interface Props {
  shopItems: Coin2uShopItem[];
  shopLoading: boolean;
  dashboard: Coin2uDashboard | null;
  onConfirmItem: (item: Coin2uShopItem) => void;
}

export function Coin2uShopTab({ shopItems, shopLoading, dashboard, onConfirmItem }: Props) {
  const [shopQuery, setShopQuery] = useState('');
  const [shopCategory, setShopCategory] = useState('all');

  const activeShopItems = useMemo(
    () => shopItems.filter((item) => item.Active && item.Stock > 0),
    [shopItems],
  );

  const shopCategories = useMemo(() => {
    return ['all', ...Array.from(new Set(activeShopItems.map(itemCategory))).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [activeShopItems]);

  const filteredShopItems = useMemo(
    () =>
      activeShopItems
        .filter((item) => matchesShopItem(item, shopQuery, shopCategory))
        .sort((a, b) => a.Price - b.Price || a.Name.localeCompare(b.Name, 'pt-BR')),
    [activeShopItems, shopQuery, shopCategory],
  );

  return (
    <div className="coin2u-shop-wrap">
      <div className="coin2u-shop-controls">
        <label className="coin2u-search">
          <Search size={14} />
          <input
            type="search"
            placeholder="Buscar item"
            value={shopQuery}
            onChange={(e) => setShopQuery(e.target.value)}
          />
        </label>
        <div className="coin2u-history-filters" role="tablist" aria-label="Categorias da loja">
          {shopCategories.slice(0, 6).map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={shopCategory === category}
              className={shopCategory === category ? 'active' : ''}
              onClick={() => setShopCategory(category)}
              data-sound="tab-home"
            >
              {category === 'all' ? 'Todos' : category}
            </button>
          ))}
        </div>
      </div>

      <div className="coin2u-shop-grid">
        {shopLoading && shopItems.length === 0 ? (
          <p className="coin2u-empty">Carregando loja...</p>
        ) : filteredShopItems.length === 0 ? (
          <p className="coin2u-empty">Nenhum item na loja.</p>
        ) : (
          filteredShopItems.map((item) => {
            const canBuy = (dashboard?.Coins ?? 0) >= item.Price;
            return (
              <article key={item.Id} className="coin2u-shop-card">
                <div className="coin2u-shop-card__media">
                  {item.Imagem ? (
                    <img src={item.Imagem} alt="" loading="lazy" />
                  ) : (
                    <Package size={34} />
                  )}
                  <span className="coin2u-shop-card__badge">{itemCategory(item)}</span>
                </div>
                <div className="coin2u-shop-card__body">
                  <div>
                    <h3 title={item.Name}>{item.Name}</h3>
                    <p title={item.Description || 'Sem descricao.'}>{item.Description || 'Sem descricao.'}</p>
                  </div>
                  <div className="coin2u-shop-card__meta">
                    <span>{formatReal(item.PriceInReal)}</span>
                    <strong>
                      <CoinIcon variant="gold" /> {item.Price}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="warm"
                    disabled={!canBuy}
                    onClick={() => onConfirmItem(item)}
                    data-sound="coin"
                  >
                    <ShoppingBag size={15} />
                    Comprar
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

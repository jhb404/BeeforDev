import { useMemo } from 'react';
import type { Coin2uTransaction } from '@shared/types/index';
import { formatDate } from '../utils/coin2uFormat';

interface Props {
  log: Coin2uTransaction[];
}

export function Coin2uPurchasesTab({ log }: Props) {
  const purchaseLog = useMemo(
    () => log.filter((item) => item.ShopItemId || item.ShopItemName),
    [log],
  );

  return (
    <div className="coin2u-history-wrap">
      <div className="coin2u-history-list">
        {purchaseLog.length === 0 ? (
          <p className="coin2u-empty">Sem compras ainda.</p>
        ) : (
          purchaseLog.map((item) => (
            <article key={item.TransactionId} className="coin2u-transaction">
              <div className="coin2u-transaction__amount sent">
                -{item.Coins ?? item.Amount}
              </div>
              <div className="coin2u-transaction__main">
                <strong>{item.ShopItemName ?? 'Compra na loja'}</strong>
                <span>Compra · {formatDate(item.Date)}</span>
                {item.Message && <p>{item.Message}</p>}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

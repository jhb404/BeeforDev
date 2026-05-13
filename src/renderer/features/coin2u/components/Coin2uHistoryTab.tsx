import { useMemo, useState } from 'react';
import type { Coin2uTransaction } from '@shared/types';
import { formatDate } from '../utils/coin2uFormat';

type HistoryFilter = 'all' | 'sent' | 'received';

interface Props {
  log: Coin2uTransaction[];
  userId: number | null;
}

export function Coin2uHistoryTab({ log, userId }: Props) {
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');

  const filteredLog = useMemo(() => {
    return log.filter((item) => {
      if (item.ShopItemId || item.ShopItemName) return false;
      if (historyFilter === 'sent') return userId ? item.FromId === userId : false;
      if (historyFilter === 'received') return userId ? item.ToId === userId : false;
      return true;
    });
  }, [log, historyFilter, userId]);

  return (
    <div className="coin2u-history-wrap">
      <div className="coin2u-history-filters" role="tablist">
        {(
          [
            ['all', 'Todos'],
            ['sent', 'Enviados'],
            ['received', 'Recebidos'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={historyFilter === value}
            className={historyFilter === value ? 'active' : ''}
            onClick={() => setHistoryFilter(value)}
            data-sound="tab-home"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="coin2u-history-list">
        {filteredLog.length === 0 ? (
          <p className="coin2u-empty">Sem transacoes nesse filtro.</p>
        ) : (
          filteredLog.map((item) => {
            const sent = userId ? item.FromId === userId : false;
            return (
              <article key={item.TransactionId} className="coin2u-transaction">
                <div className={`coin2u-transaction__amount ${sent ? 'sent' : 'received'}`}>
                  {sent ? '-' : '+'}
                  {item.Amount}
                </div>
                <div className="coin2u-transaction__main">
                  <strong>{sent ? item.ToName : item.FromName}</strong>
                  <span>
                    {sent ? 'Enviado' : 'Recebido'} · {formatDate(item.Date)}
                  </span>
                  {item.Message && <p>{item.Message}</p>}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

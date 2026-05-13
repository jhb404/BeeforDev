import type { Coin2uDashboard } from '@shared/types';
import { Clock, Refresh } from '../../../components/common/Icons';
import { CoinIcon } from './Coin2uCoinIcon';

export type Coin2uTab = 'send' | 'shop' | 'purchases' | 'history';

interface Props {
  dashboard: Coin2uDashboard | null;
  loading: boolean;
  transferring: boolean;
  tab: Coin2uTab;
  shopItemsLoaded: boolean;
  onTabChange: (tab: Coin2uTab) => void;
  onRefresh: () => void;
  onClose: () => void;
  onShopOpen: () => void;
}

export function Coin2uHeader({
  dashboard,
  loading,
  transferring,
  tab,
  shopItemsLoaded,
  onTabChange,
  onRefresh,
  onClose,
  onShopOpen,
}: Props) {
  return (
    <>
      <div className="modal-head">
        <div>
          <p className="eyebrow">Coin2U</p>
          <h2 id="coin2u-modal-title">Coins</h2>
          <p className="coin2u-modal__subtitle">
            {loading && 'Atualizando...'}
            {!loading && dashboard && `${dashboard.Coins} coins · ${dashboard.ExchangeCoins} para doar · expira em ${dashboard.DaysToExpire}d`}
            {!loading && !dashboard && 'Sem dados carregados'}
          </p>
        </div>
        <div className="coin2u-modal__head-actions">
          <button
            type="button"
            className="secondary compact"
            onClick={onRefresh}
            disabled={loading || transferring}
            data-sound="team-refresh"
          >
            <Refresh size={14} />
            Atualizar
          </button>
          <button type="button" className="secondary compact" onClick={onClose} data-sound="close">
            Fechar
          </button>
        </div>
      </div>

      <div className="coin2u-modal__toolbar">
        <div className="coin2u-balance-grid" aria-label="Resumo de coins">
          <div className="coin2u-balance-card">
            <CoinIcon variant="gold" />
            <span>Saldo</span>
            <strong>{dashboard?.Coins ?? 0}</strong>
          </div>
          <div className="coin2u-balance-card">
            <CoinIcon variant="purple" />
            <span>Doaveis</span>
            <strong>{dashboard?.ExchangeCoins ?? 0}</strong>
          </div>
          <div className="coin2u-balance-card">
            <Clock size={17} />
            <span>Expira</span>
            <strong>{dashboard?.DaysToExpire ?? 0}d</strong>
          </div>
        </div>

        <div className="coin2u-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'send'}
            className={tab === 'send' ? 'active' : ''}
            onClick={() => onTabChange('send')}
            data-sound="tab-home"
          >
            Enviar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'shop'}
            className={tab === 'shop' ? 'active' : ''}
            onClick={() => {
              onTabChange('shop');
              if (!shopItemsLoaded) onShopOpen();
            }}
            data-sound="tab-home"
          >
            Loja
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'history'}
            className={tab === 'history' ? 'active' : ''}
            onClick={() => onTabChange('history')}
            data-sound="tab-home"
          >
            Historico
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'purchases'}
            className={tab === 'purchases' ? 'active' : ''}
            onClick={() => onTabChange('purchases')}
            data-sound="tab-home"
          >
            Compras
          </button>
        </div>
      </div>
    </>
  );
}

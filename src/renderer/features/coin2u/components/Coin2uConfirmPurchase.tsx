import type { Coin2uDashboard, Coin2uShopItem } from '@shared/types/index';
import { ShoppingBag } from '../../../components/common/Icons';

interface Props {
  item: Coin2uShopItem;
  dashboard: Coin2uDashboard | null;
  purchasing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function Coin2uConfirmPurchase({ item, dashboard, purchasing, onCancel, onConfirm }: Props) {
  return (
    <div className="coin2u-confirm-backdrop" role="presentation">
      <section
        className="coin2u-confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="coin2u-confirm-title"
      >
        <div className="coin2u-confirm__head">
          <ShoppingBag size={18} />
          <div>
            <h3 id="coin2u-confirm-title">Deseja confirmar sua compra?</h3>
            <p>{item.Name}</p>
          </div>
        </div>
        <div className="coin2u-confirm__ledger">
          <div>
            <span>Saldo Atual</span>
            <strong>{dashboard?.Coins ?? 0}</strong>
          </div>
          <div>
            <span>{item.Name}</span>
            <strong>-{item.Price}</strong>
          </div>
          <div className="coin2u-confirm__total">
            <span>Saldo Final</span>
            <strong>{(dashboard?.Coins ?? 0) - item.Price}</strong>
          </div>
        </div>
        <div className="coin2u-confirm__actions">
          <button
            type="button"
            className="secondary"
            onClick={onCancel}
            disabled={purchasing}
            data-sound="close"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="warm"
            onClick={onConfirm}
            disabled={purchasing}
            data-sound="success"
          >
            {purchasing ? 'Comprando...' : 'Confirmar'}
          </button>
        </div>
      </section>
    </div>
  );
}

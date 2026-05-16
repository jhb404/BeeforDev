import { useEffect, useState } from 'react';
import { ModalShell } from '../../../components/ui/ModalShell';
import type {
  AppSettings,
  Coin2uDashboard,
  Coin2uShopItem,
  Coin2uTransaction,
} from '@shared/types/index';
import { playUiSound } from '../../../utils/alarm';
import { useEscapeToClose } from '../../../hooks/useEscapeToClose';
import { coin2uClient } from '../../../services/ipc';
import { useCoin2uData } from '../hooks/useCoin2uData';
import { useCoin2uShop } from '../hooks/useCoin2uShop';
import { useCoin2uToast } from '../hooks/useCoin2uToast';
import { Coin2uHeader, type Coin2uTab } from './Coin2uHeader';
import { Coin2uSendTab } from './Coin2uSendTab';
import { Coin2uShopTab } from './Coin2uShopTab';
import { Coin2uHistoryTab } from './Coin2uHistoryTab';
import { Coin2uPurchasesTab } from './Coin2uPurchasesTab';
import { Coin2uConfirmPurchase } from './Coin2uConfirmPurchase';
import { Coin2uToast } from './Coin2uToast';
import { getError } from '@shared/result';

interface Props {
  open: boolean;
  settings?: AppSettings | null;
  onClose: () => void;
  onDataChanged?: (dashboard: Coin2uDashboard | null, log: Coin2uTransaction[]) => void;
}

export function Coin2uModal({ open, settings, onClose, onDataChanged }: Props) {
  const data = useCoin2uData({ onDataChanged });
  const shop = useCoin2uShop({ setDashboard: data.setDashboard, setError: data.setError });
  const toastApi = useCoin2uToast(open);

  const [tab, setTab] = useState<Coin2uTab>('send');
  const [confirmItem, setConfirmItem] = useState<Coin2uShopItem | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const refreshAll = async () => {
    await data.refresh();
    void shop.refreshShop(false);
  };

  useEffect(() => {
    if (!open) return;
    void coin2uClient.getCreds().then((creds) => {
      if (creds?.userId) data.setUserId(creds.userId);
    });
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEscapeToClose(open, () => {
    if (confirmItem) {
      if (!purchasing) setConfirmItem(null);
      return;
    }
    onClose();
  });

  const confirmPurchase = async () => {
    if (!confirmItem) return;
    setPurchasing(true);
    try {
      const res = await coin2uClient.buyItem({
        shopItemId: confirmItem.Id,
        price: Math.floor(confirmItem.Price),
      });
      if (!res.ok || !res.data) throw new Error(getError(res) || 'Compra recusada.');
      if (settings?.uiSounds) playUiSound('success');
      toastApi.showToast('ok', 'Compra realizada.');
      setConfirmItem(null);
      await refreshAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toastApi.showToast('err', msg);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      className="coin2u-modal"
      labelledBy="coin2u-modal-title"
      disableEsc
    >
      <Coin2uHeader
        dashboard={data.dashboard}
        loading={data.loading}
        transferring={false}
        tab={tab}
        shopItemsLoaded={shop.shopItems.length > 0}
        onTabChange={setTab}
        onRefresh={() => void refreshAll()}
        onClose={onClose}
        onShopOpen={() => void shop.refreshShop()}
      />

      <div className="coin2u-modal__body">
        {data.error && (
          <div className="coin2u-warn">
            Falha ao atualizar. <span>{data.error}</span>
          </div>
        )}

        {tab === 'send' ? (
          <Coin2uSendTab
            dashboard={data.dashboard}
            loading={data.loading}
            settings={settings}
            onAfterTransfer={refreshAll}
            onToast={toastApi.showToast}
          />
        ) : tab === 'shop' ? (
          <Coin2uShopTab
            shopItems={shop.shopItems}
            shopLoading={shop.shopLoading}
            dashboard={data.dashboard}
            onConfirmItem={setConfirmItem}
          />
        ) : tab === 'purchases' ? (
          <Coin2uPurchasesTab log={data.log} />
        ) : (
          <Coin2uHistoryTab log={data.log} userId={data.userId} />
        )}
      </div>

      {toastApi.toast && <Coin2uToast kind={toastApi.toast.kind} msg={toastApi.toast.msg} />}

      {confirmItem && (
        <Coin2uConfirmPurchase
          item={confirmItem}
          dashboard={data.dashboard}
          purchasing={purchasing}
          onCancel={() => setConfirmItem(null)}
          onConfirm={() => void confirmPurchase()}
        />
      )}
    </ModalShell>
  );
}

import { useEffect, useMemo, useState } from 'react';
import type { AppSettings, Coin2uDashboard, Coin2uMember, Coin2uShopItem, Coin2uTransaction } from '../../shared/types';
import { loadCoin2uCache, saveCoin2uCache, transactionSignature } from '../utils/coin2uCache';
import { playUiSound } from '../utils/alarm';
import { Check, Clock, Package, Refresh, Search, ShoppingBag, Users } from './Icons';
import { CoinIcon } from './Coin2uCoinIcon';

type Tab = 'send' | 'shop' | 'history';
type HistoryFilter = 'all' | 'sent' | 'received';
type Toast = { kind: 'ok' | 'err'; msg: string };
const MEMBERS_PER_PAGE = 48;

interface Props {
  open: boolean;
  settings?: AppSettings | null;
  onClose: () => void;
  onDataChanged?: (dashboard: Coin2uDashboard | null, log: Coin2uTransaction[]) => void;
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value || '-';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function matchesMember(member: Coin2uMember, query: string): boolean {
  if (!query.trim()) return true;
  return member.Text.toLowerCase().includes(query.trim().toLowerCase());
}

function formatReal(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function itemCategory(item: Coin2uShopItem): string {
  if (/^C&A\b/i.test(item.Name.trim())) return 'Lojas virtuais';
  return item.category?.Decription || 'Outros';
}

function matchesShopItem(item: Coin2uShopItem, query: string, category: string): boolean {
  const q = query.trim().toLowerCase();
  const byCategory = category === 'all' || itemCategory(item) === category;
  if (!q) return byCategory;
  return byCategory && `${item.Name} ${item.Description} ${itemCategory(item)}`.toLowerCase().includes(q);
}

export function Coin2uModal({ open, settings, onClose, onDataChanged }: Props) {
  const cached = useMemo(() => loadCoin2uCache(), []);
  const [dashboard, setDashboard] = useState<Coin2uDashboard | null>(cached.dashboard);
  const [log, setLog] = useState<Coin2uTransaction[]>(cached.log);
  const [shopItems, setShopItems] = useState<Coin2uShopItem[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [shopLoading, setShopLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [tab, setTab] = useState<Tab>('send');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const [query, setQuery] = useState('');
  const [shopQuery, setShopQuery] = useState('');
  const [shopCategory, setShopCategory] = useState('all');
  const [confirmItem, setConfirmItem] = useState<Coin2uShopItem | null>(null);
  const [memberPage, setMemberPage] = useState(1);
  const [selected, setSelected] = useState<Coin2uMember | null>(null);
  const [amount, setAmount] = useState('1');
  const [message, setMessage] = useState('');

  const members = dashboard?.Members ?? [];
  const filteredMembers = useMemo(
    () => members.filter((m) => matchesMember(m, query)),
    [members, query],
  );
  const totalMemberPages = Math.max(1, Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE));
  const visibleMembers = filteredMembers.slice(
    (memberPage - 1) * MEMBERS_PER_PAGE,
    memberPage * MEMBERS_PER_PAGE,
  );

  const filteredLog = useMemo(() => {
    return log.filter((item) => {
      if (historyFilter === 'sent') return userId ? item.FromId === userId : false;
      if (historyFilter === 'received') return userId ? item.ToId === userId : false;
      return true;
    });
  }, [log, historyFilter, userId]);

  const activeShopItems = useMemo(
    () => shopItems.filter((item) => item.Active && item.Stock > 0),
    [shopItems],
  );

  const shopCategories = useMemo(() => {
    return ['all', ...Array.from(new Set(activeShopItems.map(itemCategory))).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [activeShopItems]);

  const filteredShopItems = useMemo(
    () => activeShopItems
      .filter((item) => matchesShopItem(item, shopQuery, shopCategory))
      .sort((a, b) => a.Price - b.Price || a.Name.localeCompare(b.Name, 'pt-BR')),
    [activeShopItems, shopQuery, shopCategory],
  );

  const persist = (nextDashboard: Coin2uDashboard | null, nextLog: Coin2uTransaction[]) => {
    saveCoin2uCache({
      dashboard: nextDashboard,
      log: nextLog,
      updatedAt: new Date().toISOString(),
      lastSeenSignature: transactionSignature(nextLog),
    });
    onDataChanged?.(nextDashboard, nextLog);
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [creds, dashRes, logRes] = await Promise.all([
        window.beefor.getCoin2uCreds(),
        window.beefor.getCoin2uDashboard(),
        window.beefor.getCoin2uLog(),
      ]);
      if (creds?.userId) setUserId(creds.userId);
      if (!dashRes.ok || !dashRes.data) throw new Error(dashRes.error ?? 'Falha no dashboard.');
      if (!logRes.ok || !logRes.data) throw new Error(logRes.error ?? 'Falha no historico.');
      setDashboard(dashRes.data);
      setLog(logRes.data.Log);
      persist(dashRes.data, logRes.data.Log);
      void refreshShop(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const refreshShop = async (showLoading = true) => {
    if (showLoading) setShopLoading(true);
    try {
      const res = await window.beefor.getCoin2uShop();
      if (!res.ok || !res.data) throw new Error(res.error ?? 'Falha ao carregar loja.');
      setShopItems(res.data.ShopItems);
      setDashboard((prev) => prev ? { ...prev, Coins: res.data.Coins } : prev);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      if (showLoading) setShopLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setToast(null);
    void window.beefor.getCoin2uCreds().then((creds) => {
      if (creds?.userId) setUserId(creds.userId);
    });
    void refresh();
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setMemberPage(1);
  }, [query]);

  useEffect(() => {
    if (memberPage > totalMemberPages) setMemberPage(totalMemberPages);
  }, [memberPage, totalMemberPages]);

  if (!open) return null;

  const maxDonation = dashboard?.ExchangeCoins ?? 0;
  const amountNumber = Number(amount);
  const canTransfer =
    !!selected &&
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    amountNumber <= maxDonation &&
    !transferring;

  const submit = async () => {
    if (!selected) {
      setToast({ kind: 'err', msg: 'Escolha uma pessoa.' });
      return;
    }
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setToast({ kind: 'err', msg: 'Quantia invalida.' });
      return;
    }
    if (amountNumber > maxDonation) {
      setToast({ kind: 'err', msg: 'Saldo para doar insuficiente.' });
      return;
    }

    setTransferring(true);
    try {
      const res = await window.beefor.transferCoin2uCoins({
        To: selected.Value,
        Amount: Math.floor(amountNumber),
        Message: message.trim(),
      });
      if (!res.ok || !res.data) throw new Error(res.error ?? 'Transferencia recusada.');
      if (settings?.uiSounds) playUiSound('success');
      setToast({ kind: 'ok', msg: 'Coins enviados.' });
      setMessage('');
      setAmount('1');
      setSelected(null);
      setQuery('');
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setToast({ kind: 'err', msg });
    } finally {
      setTransferring(false);
    }
  };

  const confirmPurchase = async () => {
    if (!confirmItem) return;
    setPurchasing(true);
    try {
      const res = await window.beefor.buyCoin2uItem({
        shopItemId: confirmItem.Id,
        price: Math.floor(confirmItem.Price),
      });
      if (!res.ok || !res.data) throw new Error(res.error ?? 'Compra recusada.');
      if (settings?.uiSounds) playUiSound('success');
      setToast({ kind: 'ok', msg: 'Compra realizada.' });
      setConfirmItem(null);
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setToast({ kind: 'err', msg });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="modal-card coin2u-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="coin2u-modal-title"
      >
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
              onClick={() => void refresh()}
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
              onClick={() => setTab('send')}
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
                setTab('shop');
                if (shopItems.length === 0) void refreshShop();
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
              onClick={() => setTab('history')}
              data-sound="tab-home"
            >
              Historico
            </button>
          </div>
        </div>

        <div className="coin2u-modal__body">
          {error && (
            <div className="coin2u-warn">
              Falha ao atualizar. <span>{error}</span>
            </div>
          )}

          {tab === 'send' ? (
            <div className="coin2u-send-grid">
              <div className="coin2u-send-main">
                <label className="coin2u-search">
                  <Search size={14} />
                  <input
                    type="search"
                    placeholder="Buscar pessoa"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>

                <div className="coin2u-member-list" role="listbox" aria-label="Pessoas">
                  {filteredMembers.length === 0 ? (
                    <p className="coin2u-empty">{loading ? 'Carregando pessoas...' : 'Nada encontrado.'}</p>
                  ) : (
                    visibleMembers.map((m) => (
                      <button
                        key={m.Value}
                        type="button"
                        className={`coin2u-member ${selected?.Value === m.Value ? 'coin2u-member--active' : ''}`}
                        onClick={() => setSelected(m)}
                        data-sound="calendar-pick"
                        role="option"
                        aria-selected={selected?.Value === m.Value}
                      >
                        <span className="coin2u-member__avatar">
                          {m.Text.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                        </span>
                        <span className="coin2u-member__name">{m.Text}</span>
                      </button>
                    ))
                  )}
                </div>

                {filteredMembers.length > MEMBERS_PER_PAGE && (
                  <div className="coin2u-pagination">
                    <button
                      type="button"
                      className="secondary compact"
                      onClick={() => setMemberPage((p) => Math.max(1, p - 1))}
                      disabled={memberPage <= 1}
                      data-sound="click"
                    >
                      Anterior
                    </button>
                    <span>{memberPage} / {totalMemberPages} · {filteredMembers.length} pessoas</span>
                    <button
                      type="button"
                      className="secondary compact"
                      onClick={() => setMemberPage((p) => Math.min(totalMemberPages, p + 1))}
                      disabled={memberPage >= totalMemberPages}
                      data-sound="click"
                    >
                      Proxima
                    </button>
                  </div>
                )}
              </div>

              <aside className="coin2u-transfer-panel">
                <div className="coin2u-transfer-panel__head">
                  <Users size={18} />
                  <div>
                    <span>Destino</span>
                    <strong>{selected?.Text ?? 'Nenhuma pessoa'}</strong>
                  </div>
                </div>

                <label className="coin2u-field">
                  Quantia
                  <input
                    type="number"
                    min="1"
                    max={maxDonation || undefined}
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </label>

                <label className="coin2u-field">
                  Mensagem
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Opcional"
                    maxLength={240}
                  />
                </label>

                <button
                  type="button"
                  className="warm"
                  disabled={!canTransfer}
                  onClick={() => void submit()}
                  data-sound="coin"
                >
                  <Check size={15} />
                  {transferring ? 'Enviando...' : 'Enviar coins'}
                </button>
              </aside>
            </div>
          ) : tab === 'shop' ? (
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
                            <strong><CoinIcon variant="gold" /> {item.Price}</strong>
                          </div>
                          <button
                            type="button"
                            className="warm"
                            disabled={!canBuy}
                            onClick={() => setConfirmItem(item)}
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
          ) : (
            <div className="coin2u-history-wrap">
              <div className="coin2u-history-filters" role="tablist">
                {([
                  ['all', 'Todos'],
                  ['sent', 'Enviados'],
                  ['received', 'Recebidos'],
                ] as const).map(([value, label]) => (
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
                          {sent ? '-' : '+'}{item.Amount}
                        </div>
                        <div className="coin2u-transaction__main">
                          <strong>{sent ? item.ToName : item.FromName}</strong>
                          <span>{sent ? 'Enviado' : 'Recebido'} · {formatDate(item.Date)}</span>
                          {item.Message && <p>{item.Message}</p>}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {toast && (
          <div className={`toast ${toast.kind}`} role={toast.kind === 'err' ? 'alert' : 'status'}>
            <span className="toast__icon" aria-hidden="true">{toast.kind === 'ok' ? '✓' : '!'}</span>
            <span className="toast__body">
              <strong>{toast.kind === 'ok' ? 'Tudo certo' : 'Atencao'}</strong>
              <span>{toast.msg}</span>
            </span>
          </div>
        )}

        {confirmItem && (
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
                  <h3 id="coin2u-confirm-title">Deseja confirmar compra?</h3>
                  <p>{confirmItem.Name}</p>
                </div>
              </div>
              <div className="coin2u-confirm__ledger">
                <div><span>Saldo Atual</span><strong>{dashboard?.Coins ?? 0}</strong></div>
                <div><span>{confirmItem.Name}</span><strong>-{confirmItem.Price}</strong></div>
                <div className="coin2u-confirm__total">
                  <span>Saldo Final</span>
                  <strong>{(dashboard?.Coins ?? 0) - confirmItem.Price}</strong>
                </div>
              </div>
              <div className="coin2u-confirm__actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setConfirmItem(null)}
                  disabled={purchasing}
                  data-sound="close"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="warm"
                  onClick={() => void confirmPurchase()}
                  disabled={purchasing}
                  data-sound="success"
                >
                  {purchasing ? 'Comprando...' : 'Confirmar'}
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

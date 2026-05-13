import { useEffect, useMemo, useState } from 'react';
import type { AppSettings, Coin2uDashboard, Coin2uMember } from '@shared/types';
import { Check, Search, Users } from '../../../components/common/Icons';
import { playUiSound } from '../../../utils/alarm';
import { coin2uClient } from '../../../services/ipc';
import { matchesMember } from '../utils/coin2uFormat';

const MEMBERS_PER_PAGE = 48;

interface Props {
  dashboard: Coin2uDashboard | null;
  loading: boolean;
  settings?: AppSettings | null;
  onAfterTransfer: () => Promise<void>;
  onToast: (kind: 'ok' | 'err', msg: string) => void;
}

export function Coin2uSendTab({ dashboard, loading, settings, onAfterTransfer, onToast }: Props) {
  const [query, setQuery] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [selected, setSelected] = useState<Coin2uMember | null>(null);
  const [amount, setAmount] = useState('1');
  const [message, setMessage] = useState('');
  const [transferring, setTransferring] = useState(false);

  const filteredMembers = useMemo(
    () => (dashboard?.Members ?? []).filter((m) => matchesMember(m, query)),
    [dashboard?.Members, query],
  );
  const totalMemberPages = Math.max(1, Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE));
  const visibleMembers = filteredMembers.slice(
    (memberPage - 1) * MEMBERS_PER_PAGE,
    memberPage * MEMBERS_PER_PAGE,
  );

  useEffect(() => {
    setMemberPage(1);
  }, [query]);

  useEffect(() => {
    if (memberPage > totalMemberPages) setMemberPage(totalMemberPages);
  }, [memberPage, totalMemberPages]);

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
      onToast('err', 'Escolha uma pessoa.');
      return;
    }
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      onToast('err', 'Quantia invalida.');
      return;
    }
    if (amountNumber > maxDonation) {
      onToast('err', 'Saldo para doar insuficiente.');
      return;
    }

    setTransferring(true);
    try {
      const res = await coin2uClient.transfer({
        To: selected.Value,
        Amount: Math.floor(amountNumber),
        Message: message.trim(),
      });
      if (!res.ok || !res.data) throw new Error(res.error ?? 'Transferencia recusada.');
      if (settings?.uiSounds) playUiSound('success');
      onToast('ok', 'Coins enviados.');
      setMessage('');
      setAmount('1');
      setSelected(null);
      setQuery('');
      await onAfterTransfer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      onToast('err', msg);
    } finally {
      setTransferring(false);
    }
  };

  return (
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
                  {m.Text.split(' ')
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join('')
                    .toUpperCase()}
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
            <span>
              {memberPage} / {totalMemberPages} · {filteredMembers.length} pessoas
            </span>
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
  );
}

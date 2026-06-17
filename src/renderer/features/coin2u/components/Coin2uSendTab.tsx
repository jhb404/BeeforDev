import { useEffect, useMemo, useState } from 'react';
import type { AppSettings, Coin2uDashboard, Coin2uMember } from '@shared/types/index';
import { Check, Layers, Search, Sparkles, Users } from '../../../components/common/Icons';
import { playUiSound } from '../../../utils/alarm';
import { useIpc } from '../../../services/ipc';
import { matchesMember } from '../utils/coin2uFormat';
import { getError } from '@shared/result';

const MEMBERS_PER_PAGE = 48;
const MAX_RECIPIENTS = 10;

interface Props {
  dashboard: Coin2uDashboard | null;
  loading: boolean;
  settings?: AppSettings | null;
  onAfterTransfer: () => Promise<void>;
  onToast: (kind: 'ok' | 'err', msg: string) => void;
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function Coin2uSendTab({ dashboard, loading, settings, onAfterTransfer, onToast }: Props) {
  const { coin2u: coin2uClient } = useIpc();
  const [query, setQuery] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [multi, setMulti] = useState(false);
  const [selected, setSelected] = useState<Coin2uMember | null>(null);
  const [recipients, setRecipients] = useState<Coin2uMember[]>([]);
  const [amount, setAmount] = useState('1');
  const [message, setMessage] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

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
  const amountValid = Number.isFinite(amountNumber) && amountNumber > 0;
  const perPerson = Math.floor(amountNumber);

  // Quem está selecionado depende do modo.
  const recipientCount = multi ? recipients.length : selected ? 1 : 0;
  const totalCost = amountValid ? perPerson * recipientCount : 0;
  const enoughBalance = totalCost > 0 && totalCost <= maxDonation;

  const canTransfer = recipientCount > 0 && amountValid && enoughBalance && !transferring;

  // Sugestão: divide saldo igualmente, arredonda p/ baixo (último inteiro).
  const suggestion = recipientCount > 0 ? Math.floor(maxDonation / recipientCount) : 0;
  const canSuggest = multi && recipientCount > 0 && suggestion >= 1;

  const isPicked = (m: Coin2uMember) =>
    multi ? recipients.some((r) => r.Value === m.Value) : selected?.Value === m.Value;

  const toggleMember = (m: Coin2uMember) => {
    if (!multi) {
      setSelected(m);
      return;
    }
    setRecipients((prev) => {
      const exists = prev.some((r) => r.Value === m.Value);
      if (exists) return prev.filter((r) => r.Value !== m.Value);
      if (prev.length >= MAX_RECIPIENTS) {
        onToast('err', `Máximo de ${MAX_RECIPIENTS} pessoas.`);
        return prev;
      }
      return [...prev, m];
    });
  };

  const switchMulti = (on: boolean) => {
    setMulti(on);
    // Migra a seleção entre modos p/ não perder o que já foi escolhido.
    if (on) {
      setRecipients(selected ? [selected] : []);
    } else {
      setSelected(recipients[0] ?? selected ?? null);
    }
  };

  const applySuggestion = () => {
    if (!canSuggest) return;
    setAmount(String(suggestion));
    if (settings?.uiSounds) playUiSound('click');
  };

  const resetAfterSend = () => {
    setMessage('');
    setAmount('1');
    setSelected(null);
    setRecipients([]);
    setQuery('');
  };

  const submitSingle = async () => {
    if (!selected) {
      onToast('err', 'Escolha uma pessoa.');
      return;
    }
    const res = await coin2uClient.transfer({
      To: selected.Value,
      Amount: perPerson,
      Message: message.trim(),
    });
    if (!res.ok || !res.data) throw new Error(getError(res) || 'Transferência recusada.');
    if (settings?.uiSounds) playUiSound('success');
    onToast('ok', 'Coins enviados.');
    resetAfterSend();
  };

  const submitMulti = async () => {
    const msg = message.trim();
    const failures: string[] = [];
    let sent = 0;

    onToast('ok', `Enviando ${perPerson} coins para ${recipients.length} pessoas…`);
    setProgress({ done: 0, total: recipients.length });

    // Sem endpoint em lote: envia 1 por vez, sequencial.
    for (const r of recipients) {
      try {
        const res = await coin2uClient.transfer({ To: r.Value, Amount: perPerson, Message: msg });
        if (!res.ok || !res.data) throw new Error(getError(res) || 'recusada');
        sent += 1;
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        failures.push(`${r.Text} (${reason})`);
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }

    if (failures.length === 0) {
      if (settings?.uiSounds) playUiSound('success');
      onToast('ok', `${perPerson} coins enviados para ${sent} pessoas.`);
      resetAfterSend();
    } else if (sent > 0) {
      onToast('err', `Enviado p/ ${sent}, falhou p/ ${failures.length}: ${failures.join('; ')}`);
      // Mantém só quem falhou selecionado p/ tentar de novo.
      setRecipients(recipients.filter((r) => failures.some((f) => f.startsWith(r.Text))));
    } else {
      onToast('err', `Nenhum envio concluído: ${failures.join('; ')}`);
    }
  };

  const submit = async () => {
    if (recipientCount === 0) {
      onToast('err', 'Escolha pelo menos uma pessoa.');
      return;
    }
    if (!amountValid) {
      onToast('err', 'Quantia inválida.');
      return;
    }
    if (!enoughBalance) {
      onToast(
        'err',
        multi
          ? `Saldo insuficiente: precisa de ${totalCost}, tem ${maxDonation}.`
          : 'Saldo para doar insuficiente.',
      );
      return;
    }

    setTransferring(true);
    try {
      if (multi) await submitMulti();
      else await submitSingle();
      await onAfterTransfer();
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      onToast('err', m);
    } finally {
      setTransferring(false);
      setProgress(null);
    }
  };

  return (
    <div className="coin2u-send-grid">
      <div className="coin2u-send-main">
        <div className="coin2u-send-toolbar">
          <label className="coin2u-search">
            <Search size={14} />
            <input
              type="search"
              placeholder="Buscar pessoa"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button
            type="button"
            className={`coin2u-multi-toggle ${multi ? 'coin2u-multi-toggle--on' : ''}`}
            onClick={() => switchMulti(!multi)}
            aria-pressed={multi}
            data-sound="click"
            title="Enviar para várias pessoas de uma vez"
          >
            <Layers size={14} />
            Selecionar vários
          </button>
        </div>

        <div
          className="coin2u-member-list"
          role="listbox"
          aria-label="Pessoas"
          aria-multiselectable={multi}
        >
          {filteredMembers.length === 0 ? (
            <p className="coin2u-empty">{loading ? 'Carregando pessoas...' : 'Nada encontrado.'}</p>
          ) : (
            visibleMembers.map((m) => {
              const picked = isPicked(m);
              return (
                <button
                  key={m.Value}
                  type="button"
                  className={`coin2u-member ${picked ? 'coin2u-member--active' : ''}`}
                  onClick={() => toggleMember(m)}
                  data-sound="calendar-pick"
                  role="option"
                  aria-selected={picked}
                >
                  <span className="coin2u-member__avatar">{initials(m.Text)}</span>
                  <span className="coin2u-member__name">{m.Text}</span>
                  {picked && (
                    <span className="coin2u-member__check" aria-hidden>
                      <Check size={13} />
                    </span>
                  )}
                </button>
              );
            })
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
          <Users size={18} className="coin2u-transfer-panel__icon" />
          <div>
            <span>Destino{multi ? ` · ${recipientCount}/${MAX_RECIPIENTS}` : ''}</span>
            {multi ? (
              recipients.length === 0 ? (
                <strong>Nenhuma pessoa</strong>
              ) : (
                <div className="coin2u-chips">
                  {recipients.map((r) => (
                    <button
                      type="button"
                      key={r.Value}
                      className="coin2u-chip"
                      onClick={() => toggleMember(r)}
                      title={`Remover ${r.Text}`}
                      aria-label={`Remover ${r.Text}`}
                      data-sound="click"
                    >
                      <span className="coin2u-chip__txt">{r.Text}</span>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <strong>{selected?.Text ?? 'Nenhuma pessoa'}</strong>
            )}
          </div>
        </div>

        <label className="coin2u-field">
          {multi ? 'Quantia por pessoa' : 'Quantia'}
          <input
            type="number"
            min="1"
            max={maxDonation || undefined}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        {multi && (
          <button
            type="button"
            className="secondary compact coin2u-suggest"
            onClick={applySuggestion}
            disabled={!canSuggest}
            data-sound="click"
            title="Divide seu saldo igualmente (arredonda p/ baixo)"
          >
            <Sparkles size={14} />
            Sugerir divisão{canSuggest ? ` · ${suggestion}/pessoa` : ''}
          </button>
        )}

        <label className="coin2u-field">
          Mensagem
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Opcional"
            maxLength={240}
          />
        </label>

        {multi && recipientCount > 0 && amountValid && (
          <div className={`coin2u-total ${enoughBalance ? '' : 'coin2u-total--over'}`}>
            <span>
              {perPerson} × {recipientCount} {recipientCount === 1 ? 'pessoa' : 'pessoas'}
            </span>
            <strong>
              {totalCost} / {maxDonation}
            </strong>
          </div>
        )}

        {progress && (
          <div
            className="coin2u-progress"
            role="progressbar"
            aria-valuenow={progress.done}
            aria-valuemin={0}
            aria-valuemax={progress.total}
          >
            <div className="coin2u-progress__bar">
              <span style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
            <span className="coin2u-progress__label">
              Enviando… {progress.done}/{progress.total}
            </span>
          </div>
        )}

        <button
          type="button"
          className="warm"
          disabled={!canTransfer}
          onClick={() => void submit()}
          data-sound="coin"
        >
          <Check size={15} />
          {transferring
            ? progress
              ? `Enviando ${progress.done}/${progress.total}…`
              : 'Enviando…'
            : multi && recipientCount > 1
              ? `Enviar para ${recipientCount} pessoas`
              : 'Enviar coins'}
        </button>
      </aside>
    </div>
  );
}

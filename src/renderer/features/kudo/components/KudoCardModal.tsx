import { useEffect, useState } from 'react';
import { ModalShell } from '../../../components/ui/ModalShell';
import {
  KUDO_CARD_EMOJI,
  KUDO_CARD_LABELS,
  KUDO_CARD_TYPES,
  type KudoCardRecipientType,
} from '@shared/types/index';
import { useKudoRecipientSearch } from '../hooks/useKudoRecipientSearch';
import { useKudoCardSend } from '../hooks/useKudoCardSend';

interface Props {
  open: boolean;
  onClose: () => void;
  onSent: (msg: string) => void;
  onError: (msg: string) => void;
}

export function KudoCardModal({ open, onClose, onSent, onError }: Props) {
  const [recipientType, setRecipientType] = useState<KudoCardRecipientType>('person');

  const search = useKudoRecipientSearch(recipientType, open);
  const send = useKudoCardSend({ onSent, onError, onClose });

  const handleClose = () => {
    if (send.submitting) return;
    onClose();
  };

  useEffect(() => {
    if (!open) {
      setRecipientType('person');
      search.reset();
      send.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <ModalShell open={open} onClose={handleClose} className="kudo-modal" labelledBy="kudo-modal-title" disableEsc={send.submitting}>
      <div className="modal-head">
        <div>
          <p className="eyebrow">Reconhecimento</p>
          <h2 id="kudo-modal-title">Enviar Kudo Card</h2>
        </div>
        <button
          data-sound="close"
          className="secondary compact"
          disabled={send.submitting}
          onClick={handleClose}
        >
          Fechar
        </button>
      </div>

      <div style={{ padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <div>
          <span className="label" style={{ marginBottom: 8, display: 'block' }}>
            Escolha o card
          </span>
          <div className="kudo-card-grid">
            {KUDO_CARD_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={`kudo-card-pick ${send.cardType === t ? 'active' : ''}`}
                disabled={send.submitting}
                onClick={() => send.setCardType(t)}
                title={KUDO_CARD_LABELS[t]}
              >
                <span className="kudo-card-emoji">{KUDO_CARD_EMOJI[t]}</span>
                <span className="kudo-card-name">{KUDO_CARD_LABELS[t]}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label" style={{ marginBottom: 8, display: 'block' }}>
            Enviar para
          </span>
          <div className="kudo-segmented" role="radiogroup">
            <button
              type="button"
              role="radio"
              aria-checked={recipientType === 'person'}
              className={recipientType === 'person' ? 'active' : ''}
              disabled={send.submitting}
              onClick={() => setRecipientType('person')}
            >
              <span className="kudo-seg-icon">👤</span>
              Uma pessoa
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={recipientType === 'team'}
              className={recipientType === 'team' ? 'active' : ''}
              disabled={send.submitting}
              onClick={() => setRecipientType('team')}
            >
              <span className="kudo-seg-icon">👥</span>
              Um time
            </button>
          </div>
        </div>

        <div className="kudo-autocomplete" ref={search.wrapRef}>
          <span className="label" style={{ marginBottom: 6, display: 'block' }}>
            {recipientType === 'person' ? 'Nome da pessoa' : 'Nome do time'}
          </span>
          <input
            type="text"
            value={search.recipientName}
            disabled={send.submitting}
            placeholder="Digite ao menos 2 letras..."
            onChange={(e) => search.setRecipientName(e.target.value)}
            onFocus={() => search.suggestions.length && search.setSuggestOpen(true)}
            autoComplete="off"
          />
          {(search.suggestOpen || search.searching) && (
            <div className="kudo-suggest" role="listbox" aria-busy={search.searching}>
              {search.searching && (
                <div className="kudo-suggest-empty kudo-suggest-loading" role="status">
                  <span className="kudo-spinner" aria-hidden="true" />
                  <span>Buscando {search.recipientName ? `"${search.recipientName}"` : ''}...</span>
                </div>
              )}
              {!search.searching && search.suggestErr && (
                <div className="kudo-suggest-empty">{search.suggestErr}</div>
              )}
              {!search.searching && !search.suggestErr && search.suggestions.length === 0 && (
                <div className="kudo-suggest-empty">Digite para buscar.</div>
              )}
              {!search.searching &&
                search.suggestions.map((s) => (
                  <button
                    key={`${s.id}-${s.name}`}
                    type="button"
                    className="kudo-suggest-item"
                    onClick={() => search.pickSuggestion(s)}
                  >
                    <strong>{s.name}</strong>
                    {s.subtitle && <span>{s.subtitle}</span>}
                  </button>
                ))}
            </div>
          )}
        </div>

        <label className="field-inline" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <span className="label">Mensagem</span>
          <textarea
            value={send.message}
            disabled={send.submitting}
            rows={4}
            placeholder="Escreva uma mensagem..."
            onChange={(e) => send.setMessage(e.target.value)}
          />
        </label>

        {send.errMsg && (
          <div className="kudo-err" role="alert">
            {send.errMsg}
          </div>
        )}

        <div className="modal-actions">
          <button data-sound="close" className="secondary" disabled={send.submitting} onClick={handleClose}>
            Cancelar
          </button>
          <button
            data-sound="kudo-sent"
            className="warm"
            disabled={send.submitting}
            onClick={() => void send.handleSubmit(recipientType, search.recipientName)}
          >
            {send.submitting ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  KUDO_CARD_EMOJI,
  KUDO_CARD_LABELS,
  KUDO_CARD_TYPES,
  type KudoCardRecipientType,
  type KudoCardType,
  type KudoSearchResult,
  type SendKudoCardRequest,
} from '../../shared/types';
import { useEscapeToClose } from '../hooks/useEscapeToClose';

interface Props {
  open: boolean;
  onClose: () => void;
  onSent: (msg: string) => void;
  onError: (msg: string) => void;
}

export function KudoCardModal({ open, onClose, onSent, onError }: Props) {
  const [recipientType, setRecipientType] = useState<KudoCardRecipientType>('person');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [cardType, setCardType] = useState<KudoCardType>(KUDO_CARD_TYPES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<KudoSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestErr, setSuggestErr] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    setRecipientName('');
    setMessage('');
    setCardType(KUDO_CARD_TYPES[0]);
    setRecipientType('person');
    setErrMsg(null);
    setSuggestions([]);
    setSuggestOpen(false);
    setSuggestErr(null);
  };

  useEffect(() => {
    if (!open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setSuggestions([]);
    setSuggestOpen(false);
    setSuggestErr(null);
  }, [recipientType]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = recipientName.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }
    const mySeq = ++seqRef.current;
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await window.beefor.searchKudoRecipient(recipientType, q);
        if (mySeq !== seqRef.current) return;
        if (res.ok && res.data) {
          setSuggestions(res.data);
          setSuggestOpen(true);
          setSuggestErr(res.data.length === 0 ? 'Nenhum resultado.' : null);
        } else {
          setSuggestions([]);
          setSuggestOpen(true);
          setSuggestErr(res.error ?? 'Falha ao buscar.');
        }
      } finally {
        if (mySeq === seqRef.current) setSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [recipientName, recipientType, open]);

  useEffect(() => {
    if (!suggestOpen) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [suggestOpen]);

  useEscapeToClose(open && !submitting, onClose);

  if (!open) return null;

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const validate = (): string | null => {
    if (!recipientName.trim()) return 'Informe o destinatário.';
    if (!message.trim()) return 'Escreva uma mensagem.';
    return null;
  };

  const pickSuggestion = (s: KudoSearchResult) => {
    setRecipientName(s.name);
    setSuggestOpen(false);
  };

  const handleSubmit = async () => {
    const v = validate();
    if (v) {
      setErrMsg(v);
      return;
    }
    setErrMsg(null);
    setSubmitting(true);
    const payload: SendKudoCardRequest = {
      recipientType,
      recipientName: recipientName.trim(),
      message: message.trim(),
      cardType,
    };
    try {
      const res = await window.beefor.sendKudoCard(payload);
      if (res.ok) {
        onSent(res.data?.message ?? 'KudoCard enviado.');
        onClose();
      } else {
        const msg = res.error ?? 'Falha ao enviar KudoCard.';
        setErrMsg(msg);
        onError(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado.';
      setErrMsg(msg);
      onError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="kudo-modal-title"
        aria-modal="true"
        className="modal-card kudo-modal"
        role="dialog"
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">Reconhecimento</p>
            <h2 id="kudo-modal-title">Enviar Kudo Card</h2>
          </div>
          <button
            data-sound="close"
            className="secondary compact"
            disabled={submitting}
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
                  className={`kudo-card-pick ${cardType === t ? 'active' : ''}`}
                  disabled={submitting}
                  onClick={() => setCardType(t)}
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
                disabled={submitting}
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
                disabled={submitting}
                onClick={() => setRecipientType('team')}
              >
                <span className="kudo-seg-icon">👥</span>
                Um time
              </button>
            </div>
          </div>

          <div className="kudo-autocomplete" ref={wrapRef}>
            <span className="label" style={{ marginBottom: 6, display: 'block' }}>
              {recipientType === 'person' ? 'Nome da pessoa' : 'Nome do time'}
            </span>
            <input
              type="text"
              value={recipientName}
              disabled={submitting}
              placeholder={
                recipientType === 'person'
                  ? 'Digite ao menos 2 letras...'
                  : 'Digite ao menos 2 letras...'
              }
              onChange={(e) => setRecipientName(e.target.value)}
              onFocus={() => suggestions.length && setSuggestOpen(true)}
              autoComplete="off"
            />
            {suggestOpen && (
              <div className="kudo-suggest" role="listbox">
                {searching && <div className="kudo-suggest-empty">Buscando...</div>}
                {!searching && suggestErr && (
                  <div className="kudo-suggest-empty">{suggestErr}</div>
                )}
                {!searching && !suggestErr && suggestions.length === 0 && (
                  <div className="kudo-suggest-empty">Digite para buscar.</div>
                )}
                {!searching &&
                  suggestions.map((s) => (
                    <button
                      key={`${s.id}-${s.name}`}
                      type="button"
                      className="kudo-suggest-item"
                      onClick={() => pickSuggestion(s)}
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
              value={message}
              disabled={submitting}
              rows={4}
              placeholder="Escreva uma mensagem..."
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>

          {errMsg && (
            <div className="kudo-err" role="alert">
              {errMsg}
            </div>
          )}

          <div className="modal-actions">
            <button data-sound="close" className="secondary" disabled={submitting} onClick={handleClose}>
              Cancelar
            </button>
            <button data-sound="kudo-sent" className="warm" disabled={submitting} onClick={() => void handleSubmit()}>
              {submitting ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

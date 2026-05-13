import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  KUDO_CARD_EMOJI,
  KUDO_CARD_LABELS,
  KUDO_CARD_TYPE_BY_TIPO,
  type KudoCardCounts,
  type KudoCardDetail,
  type KudoCardListItem,
  type KudoCardLists,
} from '../../../../shared/types';
import { FunnyLoader } from '../../../components/common/FunnyLoader';
import { useSlowHint } from '../../../hooks/useSlowHint';
import { useEscapeToClose } from '../../../hooks/useEscapeToClose';

type Tab = 'recebidos' | 'enviados';

interface Props {
  open: boolean;
  onClose: () => void;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function emojiOf(tipo: number): string {
  const t = KUDO_CARD_TYPE_BY_TIPO[tipo];
  return t ? KUDO_CARD_EMOJI[t] : '🎁';
}
function labelOf(tipo: number): string {
  const t = KUDO_CARD_TYPE_BY_TIPO[tipo];
  return t ? KUDO_CARD_LABELS[t] : `Tipo ${tipo}`;
}

export function KudoCardHistoryModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('recebidos');
  const [counts, setCounts] = useState<KudoCardCounts | null>(null);
  const [lists, setLists] = useState<KudoCardLists | null>(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<KudoCardListItem | null>(null);
  const [detail, setDetail] = useState<KudoCardDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const slowHint = useSlowHint(loading);
  const slowDetailHint = useSlowHint(loadingDetail);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setDetail(null);
      setErrMsg(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErrMsg(null);
    void (async () => {
      const [cRes, lRes] = await Promise.all([
        window.beefor.getKudoCounts(),
        window.beefor.getKudoLists(),
      ]);
      if (cancelled) return;
      if (cRes.ok && cRes.data) setCounts(cRes.data);
      if (lRes.ok && lRes.data) setLists(lRes.data);
      if (!cRes.ok || !lRes.ok) {
        setErrMsg(cRes.error ?? lRes.error ?? 'Falha ao carregar.');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!selected) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    void (async () => {
      const res = await window.beefor.getKudoDetail(selected.id);
      if (cancelled) return;
      if (res.ok && res.data) setDetail(res.data);
      else setDetail(null);
      setLoadingDetail(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  useEscapeToClose(open, onClose);

  if (!open) return null;

  const items = lists ? lists[tab] : [];

  return createPortal(
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="kudo-history-title"
        aria-modal="true"
        className="modal-card kudo-history-modal"
        role="dialog"
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">Histórico</p>
            <h2 id="kudo-history-title">Meus Kudo Cards</h2>
          </div>
          <button data-sound="close" className="secondary compact" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div className="kudo-history-body">
          <div className="kudo-history-counts">
            <div className="kudo-count-card">
              <span className="label">Recebidos</span>
              <strong>{counts?.recebidos ?? '—'}</strong>
            </div>
            <div className="kudo-count-card">
              <span className="label">Enviados</span>
              <strong>{counts?.enviados ?? '—'}</strong>
            </div>
          </div>

          <div className="kudo-history-tabs">
            <button
              className={tab === 'recebidos' ? 'active' : ''}
              onClick={() => {
                setTab('recebidos');
                setSelected(null);
              }}
            >
              Recebidos
            </button>
            <button
              className={tab === 'enviados' ? 'active' : ''}
              onClick={() => {
                setTab('enviados');
                setSelected(null);
              }}
            >
              Enviados
            </button>
          </div>

          {loading ? (
            <div className="kudo-history-loader-wrap">
              <FunnyLoader title="Carregando KudoCards" />
              {slowHint && <div className="kudo-slow-hint">{slowHint}</div>}
            </div>
          ) : errMsg ? (
            <div className="kudo-err">{errMsg}</div>
          ) : items.length === 0 ? (
            <div className="kudo-history-empty">Nenhum card.</div>
          ) : (
            <div className="kudo-history-grid">
              <ul className="kudo-history-list">
                {items.map((it) => (
                  <li key={it.id}>
                    <button
                      className={`kudo-history-item ${selected?.id === it.id ? 'active' : ''}`}
                      onClick={() => setSelected(it)}
                    >
                      <span className="kudo-history-emoji">{emojiOf(it.tipoKudoCard)}</span>
                      <span className="kudo-history-info">
                        <strong>{labelOf(it.tipoKudoCard)}</strong>
                        <span className="kudo-history-meta">
                          {tab === 'enviados'
                            ? `Para: ${it.destinatario ?? '—'}`
                            : `De: ${it.remetente ?? '—'}`}
                        </span>
                        <span className="kudo-history-date">{formatDate(it.dataEnvio)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="kudo-history-detail">
                {!selected ? (
                  <div className="kudo-history-empty">
                    Selecione um card para ver detalhes.
                  </div>
                ) : (
                  <>
                    <div className="kudo-detail-head">
                      <span className="kudo-detail-emoji">
                        {emojiOf(selected.tipoKudoCard)}
                      </span>
                      <div>
                        <strong>{labelOf(selected.tipoKudoCard)}</strong>
                        <span>{selected.mensagemKudoCard}</span>
                      </div>
                    </div>
                    <div className="kudo-detail-row">
                      <span className="label">
                        {tab === 'enviados' ? 'Destinatário' : 'Remetente'}
                      </span>
                      <strong>
                        {tab === 'enviados'
                          ? detail?.destinatario ?? selected.destinatario ?? '—'
                          : detail?.remetente ?? selected.remetente ?? '—'}
                      </strong>
                    </div>
                    <div className="kudo-detail-row">
                      <span className="label">Organização</span>
                      <strong>{selected.nomeOrganizacao}</strong>
                    </div>
                    <div className="kudo-detail-row">
                      <span className="label">Data</span>
                      <strong>{formatDate(selected.dataEnvio)}</strong>
                    </div>
                    <div className="kudo-detail-msg">
                      <span className="label">
                        Mensagem
                        {loadingDetail && (
                          <span className="kudo-detail-loading">
                            {slowDetailHint
                              ? ` · ${slowDetailHint}`
                              : ' · carregando...'}
                          </span>
                        )}
                      </span>
                      <p>{detail?.mensagemBoxKudoCard ?? selected.mensagemBoxKudoCard}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}

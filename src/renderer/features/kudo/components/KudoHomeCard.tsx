import { useCallback, useEffect, useState } from 'react';
import type { KudoCardCounts, KudoCardListItem } from '@shared/types/index';
import { KUDO_CARD_EMOJI, KUDO_CARD_LABELS, KUDO_CARD_TYPE_BY_TIPO } from '@shared/types/index';
import { useIpc } from '../../../services/ipc';
import { getError } from '@shared/result';

const PREVIEW_LIMIT = 4;

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function tipoEmoji(tipo: number): string {
  const key = KUDO_CARD_TYPE_BY_TIPO[tipo];
  return key ? KUDO_CARD_EMOJI[key] : '🎁';
}

function tipoLabel(tipo: number): string {
  const key = KUDO_CARD_TYPE_BY_TIPO[tipo];
  return key ? KUDO_CARD_LABELS[key] : 'KudoCard';
}

interface Props {
  ready: boolean;
  /** Abre o modal de envio (da Home). */
  onSend: () => void;
  /** Abre o histórico; com id, já no detalhe daquele kudo. */
  onHistory: (idKudo?: string) => void;
}

/**
 * KudoCards na Home — contadores + últimos recebidos.
 * Espelha o `app-kudo-cards-card` do goobeeteams (que aparece no home-time e no
 * perfil). Dados de `API_KUDO_COUNTS` / `API_KUDO_LISTS`.
 *
 * Os modais são da Home (`onSend` / `onHistory`) — este card só apresenta.
 */
export function KudoHomeCard({ ready, onSend, onHistory }: Props) {
  const { kudo: kudoClient } = useIpc();
  const [counts, setCounts] = useState<KudoCardCounts | null>(null);
  const [recebidos, setRecebidos] = useState<KudoCardListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [countsRes, listsRes] = await Promise.all([
        kudoClient.getCounts(),
        kudoClient.getLists(),
      ]);
      if (countsRes.ok && countsRes.data) setCounts(countsRes.data);
      if (listsRes.ok && listsRes.data) {
        setRecebidos(
          [...listsRes.data.recebidos].sort(
            (a, b) => new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime(),
          ),
        );
      }
      // Qualquer uma falhando já é motivo pra avisar — antes só avisava se as duas falhassem.
      if (!countsRes.ok || !listsRes.ok) {
        setError(getError(countsRes) || getError(listsRes) || 'Falha ao carregar KudoCards.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar KudoCards.');
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [kudoClient]);

  useEffect(() => {
    if (!ready) return;
    void carregar();
  }, [carregar, ready]);

  const preview = recebidos.slice(0, PREVIEW_LIMIT);

  return (
    <section className="home-card home-card--kudo">
      <header className="home-card__head">
        <span className="label">KudoCards</span>
        <div className="home-card__actions">
          <button
            type="button"
            className="secondary compact"
            onClick={onSend}
            disabled={!ready}
            data-sound="kudo-open"
          >
            Enviar
          </button>
          <button
            type="button"
            className="secondary compact"
            onClick={() => onHistory()}
            disabled={!ready}
            data-sound="journal"
          >
            Histórico
          </button>
        </div>
      </header>

      {!ready ? (
        <p className="home-card__hint">Sem sessão ativa — conecte para ver seus kudos.</p>
      ) : loading && !loaded ? (
        <p className="home-card__hint">Carregando KudoCards…</p>
      ) : error ? (
        <div className="home-card__empty">
          <strong>Não deu pra carregar</strong>
          <span>{error}</span>
          <button
            type="button"
            className="secondary compact"
            onClick={() => void carregar()}
            data-sound="click"
          >
            Tentar de novo
          </button>
        </div>
      ) : (
        <div className="kudo-home__body">
          <div className="kudo-home__counts">
            <div className="kudo-home__count">
              <strong>{counts?.recebidos ?? 0}</strong>
              <span className="label">Recebidos</span>
            </div>
            <div className="kudo-home__count">
              <strong>{counts?.enviados ?? 0}</strong>
              <span className="label">Enviados</span>
            </div>
          </div>

          {preview.length > 0 ? (
            <ul className="kudo-home__list">
              {preview.map((k) => (
                <li key={k.id}>
                  <button
                    type="button"
                    onClick={() => onHistory(k.id)}
                    data-sound="click"
                    title={k.mensagemKudoCard || tipoLabel(k.tipoKudoCard)}
                  >
                    <span className="kudo-home__emoji" aria-hidden="true">
                      {tipoEmoji(k.tipoKudoCard)}
                    </span>
                    <span className="kudo-home__text">
                      <span className="kudo-home__who">{k.remetente || 'Alguém'}</span>
                      <span className="kudo-home__what">{tipoLabel(k.tipoKudoCard)}</span>
                    </span>
                    <span className="kudo-home__when">{formatDate(k.dataEnvio)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="home-card__hint">
              Nenhum kudo recebido ainda. Manda um pra alguém e começa a corrente 🏆
            </p>
          )}
        </div>
      )}
    </section>
  );
}

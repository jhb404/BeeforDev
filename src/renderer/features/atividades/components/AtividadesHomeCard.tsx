import { useCallback, useEffect, useState } from 'react';
import type { BeeforAtividade } from '@shared/types/index';
import { useIpc } from '../../../services/ipc';
import { getError } from '@shared/result';
import { TIPO_ICON, TIPO_LABEL, getMomentoClass } from '../utils/atividadeDisplay';

const PREVIEW_LIMIT = 5;

/** Momentos que contam como "fechado" — saem da prévia da Home. */
function isConcluida(momento: string): boolean {
  const m = momento.toLowerCase();
  return m.includes('conclu') || m.includes('done') || m.includes('finaliz');
}

interface Props {
  ready: boolean;
  /** Abre o modal de atividades; com id, já no detalhe daquele card. */
  onOpen: (idAtividade?: string) => void;
}

/**
 * Prévia de "Minhas atividades" na Home — mesmas tarefas do AtividadesModal
 * (`/Quadro/ListarMinhasTarefas`, o mesmo endpoint do `app-minhas-tarefas` do
 * goobeeteams). Clicar numa linha abre o modal já no detalhe dela.
 *
 * O modal é da Home (`onOpen`), não deste card — evita duas instâncias montadas.
 */
export function AtividadesHomeCard({ ready, onOpen }: Props) {
  const { atividades: atividadesClient } = useIpc();
  const [items, setItems] = useState<BeeforAtividade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await atividadesClient.fetch();
      if (res.ok && res.data) {
        setItems(res.data);
      } else {
        setError(getError(res) || 'Erro ao buscar atividades.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar atividades.');
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [atividadesClient]);

  useEffect(() => {
    if (!ready) return;
    void carregar();
  }, [carregar, ready]);

  const abertas = items.filter((a) => !isConcluida(a.momento));
  const preview = [...abertas]
    .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
    .slice(0, PREVIEW_LIMIT);
  const restantes = abertas.length - preview.length;

  return (
    <section className="home-card home-card--atividades">
      <header className="home-card__head">
        <span className="label">
          Minhas atividades
          {loaded && !error ? ` · ${abertas.length} em aberto` : ''}
        </span>
        <div className="home-card__actions">
          <button
            type="button"
            className="secondary compact"
            onClick={() => void carregar()}
            disabled={!ready || loading}
            data-sound="team-refresh"
          >
            {loading ? '…' : 'Atualizar'}
          </button>
          <button
            type="button"
            className="secondary compact"
            onClick={() => onOpen()}
            disabled={!ready}
            data-sound="activity-open"
          >
            Ver todas
          </button>
        </div>
      </header>

      {!ready ? (
        <p className="home-card__hint">Sem sessão ativa — conecte para ver suas atividades.</p>
      ) : loading && !loaded ? (
        <p className="home-card__hint">Carregando atividades…</p>
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
      ) : preview.length === 0 ? (
        <div className="home-card__empty">
          <strong>
            {items.length === 0 ? 'Nenhuma atividade atribuída' : 'Nada em aberto 🎉'}
          </strong>
          <span>
            {items.length === 0
              ? 'Você não aparece como responsável em nenhum card dos quadros.'
              : `Todas as ${items.length} atividades estão concluídas.`}
          </span>
        </div>
      ) : (
        <ul className="ativ-home__list">
          {preview.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => onOpen(a.id)} data-sound="click">
                <span className="ativ-home__icon" aria-hidden="true">
                  {TIPO_ICON[a.tipo] ?? '•'}
                </span>
                <span className="ativ-home__body">
                  <span className="ativ-home__name">{a.nome}</span>
                  <span className="ativ-home__meta">
                    {a.numeroCard ? `#${a.numeroCard} · ` : ''}
                    {TIPO_LABEL[a.tipo] ?? 'Card'}
                    {a.projeto ? ` · ${a.projeto}` : ''}
                    {a.timeBoard ? ` · ${a.timeBoard}` : ''}
                  </span>
                </span>
                <span className={`ativ-home__momento ${getMomentoClass(a.momento)}`}>
                  {a.momento || '—'}
                </span>
              </button>
            </li>
          ))}
          {restantes > 0 && (
            <li className="ativ-home__more">
              <button type="button" onClick={() => onOpen()} data-sound="click">
                + {restantes} {restantes === 1 ? 'atividade' : 'atividades'}
              </button>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

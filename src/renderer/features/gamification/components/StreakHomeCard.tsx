import { useEffect, useState } from 'react';
import { StreakRankingModal } from './StreakRankingModal';

const TOP_LIMIT = 3;
/**
 * topN 30 de propósito: o main só serve do cache em disco (SWR) quando os args são
 * exatamente `(undefined, undefined, 30)`. Pedir 3 furava o cache e disparava o
 * cálculo org-wide inteiro a cada abertura — card ficava eterno em "carregando".
 * Pegamos o top 30 barato e cortamos em 3 aqui.
 */
const CACHED_TOP_N = 30;
const TROPHY = ['🥇', '🥈', '🥉'];

interface TopEntry {
  idPessoa: string;
  nome: string;
  streak: number;
  isMe: boolean;
}

interface StreakSummary {
  top: TopEntry[];
  myPos: number;
  myStreak: number;
  total: number;
}

interface Props {
  ready: boolean;
}

/**
 * Resumo do ranking de streak de mood na Home — top 3 + minha posição.
 * Mesma fonte do `StreakRankingModal` (`/Home/MoodStreakOrganizacao`, cache SWR
 * em disco no main), então o card é praticamente instantâneo com cache quente.
 * Clique abre o ranking completo.
 */
export function StreakHomeCard({ ready }: Props) {
  const [summary, setSummary] = useState<StreakSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rankingOpen, setRankingOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const http = window.beeforHttp;
        if (!http?.mood?.streakOrg) {
          setError('API HTTP indisponível — reinicie o app.');
          return;
        }
        const [sessionRes, res] = await Promise.all([
          http.sessionInfo(),
          http.mood.streakOrg(undefined, undefined, CACHED_TOP_N),
        ]);
        if (cancelled) return;
        const myId = sessionRes.ok && sessionRes.data ? sessionRes.data.idPessoa : null;

        if (!res.ok) {
          // O endpoint pode não estar publicado ainda — nesse caso o card só some.
          setError(res.error || 'Ranking indisponível.');
          return;
        }
        const data = res.data as
          | {
              pessoas?: Array<{ idPessoa: string; nome: string; streakAtual: number }>;
              totalPessoasOrganizacao?: number;
              posicaoUsuarioAtual?: number;
              streakUsuarioAtual?: number;
            }
          | undefined;
        const pessoas = Array.isArray(data?.pessoas) ? data!.pessoas : [];

        setSummary({
          top: pessoas.map((p) => ({
            idPessoa: p.idPessoa,
            nome: p.nome ?? 'Sem nome',
            streak: Number(p.streakAtual ?? 0),
            isMe: !!myId && p.idPessoa === myId,
          })),
          myPos: Number(data?.posicaoUsuarioAtual ?? 0),
          myStreak: Number(data?.streakUsuarioAtual ?? 0),
          total: Number(data?.totalPessoasOrganizacao ?? pessoas.length),
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro no ranking.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready]);

  // Ranking indisponível não vira card de erro — só não ocupa espaço.
  if (error) return null;

  return (
    <>
      <section className="home-card home-card--streak">
        <header className="home-card__head">
          <span className="label">Streak de mood</span>
          <button
            type="button"
            className="secondary compact"
            onClick={() => setRankingOpen(true)}
            disabled={!ready}
            data-sound="streak-open"
          >
            Ranking
          </button>
        </header>

        {loading && !summary ? (
          <p className="home-card__hint">Carregando ranking…</p>
        ) : !summary || summary.top.length === 0 ? (
          <p className="home-card__hint">
            Ninguém com streak ativo ainda na organização. Seja o primeiro 🔥
          </p>
        ) : (
          <div className="streak-home__body">
            <div className="streak-home__me">
              <span className="streak-home__flame" aria-hidden="true">
                🔥
              </span>
              <strong>{summary.myStreak}</strong>
              <span className="label">
                {summary.myStreak === 1 ? 'dia seguido' : 'dias seguidos'}
                {summary.myPos > 0 ? ` · #${summary.myPos} de ${summary.total}` : ''}
              </span>
            </div>

            <ol className="streak-home__top">
              {summary.top.slice(0, TOP_LIMIT).map((entry, idx) => (
                <li
                  key={entry.idPessoa || entry.nome + idx}
                  className={entry.isMe ? 'is-me' : undefined}
                >
                  <span className="streak-home__trophy" aria-hidden="true">
                    {TROPHY[idx] ?? '🏅'}
                  </span>
                  <span className="streak-home__name">{entry.nome}</span>
                  <span className="streak-home__days">{entry.streak}d</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <StreakRankingModal open={rankingOpen} onClose={() => setRankingOpen(false)} />
    </>
  );
}

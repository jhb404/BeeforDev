import { useEffect, useState } from 'react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { AlertTriangle, Flame } from '../../../components/common/Icons';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional override — usado quando endpoint não retorna usuário atual. */
  currentUserStreak?: number;
}

interface RankingEntry {
  idPessoa: string;
  name: string;
  initials: string;
  streak: number;
  isCurrentUser: boolean;
}

const TROPHY_EMOJI = ['🥇', '🥈', '🥉'];

function trophy(rank: number): string {
  if (rank <= 3) return TROPHY_EMOJI[rank - 1];
  if (rank <= 10) return '🏅';
  return '⭐';
}

function streakHeat(streak: number): string {
  if (streak >= 60) return 'inferno';
  if (streak >= 30) return 'hot';
  if (streak >= 14) return 'warm';
  if (streak >= 7) return 'spark';
  return 'mild';
}

function initialsOf(name: string): string {
  return (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

interface RankingMeta {
  total: number;
  myPos: number;
  myStreak: number;
  myInTop: boolean;
  meExtra: RankingEntry | null;
}

export function StreakRankingModal({ open, onClose, currentUserStreak }: Props) {
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [meta, setMeta] = useState<RankingMeta>({
    total: 0,
    myPos: 0,
    myStreak: 0,
    myInTop: false,
    meExtra: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        if (!window.beeforHttp) {
          setError('API HTTP indisponível — reinicie o app.');
          setEntries([]);
          return;
        }
        const sessionRes = await window.beeforHttp.sessionInfo();
        const currentId = sessionRes.ok && sessionRes.data ? sessionRes.data.idPessoa : null;

        const res = await window.beeforHttp.mood.streakOrg(undefined, undefined, 30);
        if (cancelled) return;
        if (!res.ok) {
          const err = res.error || 'Falha ao carregar ranking.';
          if (/404/.test(err)) {
            setError(
              'Endpoint de ranking ainda não disponível em produção. Será liberado no próximo deploy do server.',
            );
          } else {
            setError(err);
          }
          setEntries([]);
          return;
        }
        const data = res.data as
          | {
              pessoas?: Array<{ idPessoa: string; nome: string; streakAtual: number }>;
              totalPessoasOrganizacao?: number;
              posicaoUsuarioAtual?: number;
              streakUsuarioAtual?: number;
              usuarioAtualNoTop?: boolean;
              meuRanking?: { idPessoa: string; nome: string; streakAtual: number } | null;
            }
          | undefined;
        const pessoas = Array.isArray(data?.pessoas) ? data!.pessoas : [];

        const mapped: RankingEntry[] = pessoas.map((p) => ({
          idPessoa: p.idPessoa,
          name: p.nome ?? 'Sem nome',
          initials: initialsOf(p.nome ?? ''),
          streak: Number(p.streakAtual ?? 0),
          isCurrentUser: !!currentId && p.idPessoa === currentId,
        }));

        const meExtra: RankingEntry | null =
          data?.meuRanking && !data.usuarioAtualNoTop
            ? {
                idPessoa: data.meuRanking.idPessoa,
                name: data.meuRanking.nome ?? 'Você',
                initials: initialsOf(data.meuRanking.nome ?? ''),
                streak: Number(data.meuRanking.streakAtual ?? 0),
                isCurrentUser: true,
              }
            : null;

        setEntries(mapped);
        setMeta({
          total: Number(data?.totalPessoasOrganizacao ?? mapped.length),
          myPos: Number(data?.posicaoUsuarioAtual ?? 0),
          myStreak: Number(data?.streakUsuarioAtual ?? 0),
          myInTop: Boolean(data?.usuarioAtualNoTop),
          meExtra,
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Erro ao buscar ranking.');
        setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const data =
    currentUserStreak !== undefined
      ? entries.map((u) => (u.isCurrentUser ? { ...u, streak: currentUserStreak } : u))
      : entries;

  const myRank = meta.myPos > 0 ? meta.myPos : data.findIndex((u) => u.isCurrentUser) + 1;
  const totalRanking = meta.total > 0 ? meta.total : data.length;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      className="streak-ranking-modal"
      labelledBy="streak-ranking-title"
    >
      <div className="modal-head">
        <div>
          <p className="eyebrow">Comunidade</p>
          <h2 id="streak-ranking-title" className="streak-ranking__heading">
            <Flame size={20} /> Ranking de streak
          </h2>
          <p className="streak-ranking__subtitle">Quem mantém o mood vivo há mais tempo no time</p>
        </div>
        <button type="button" className="secondary compact" onClick={onClose} data-sound="close">
          Fechar
        </button>
      </div>

      <div className="streak-ranking__body">
        {loading && <p className="streak-ranking__hint">Carregando ranking…</p>}
        {error && !loading && (
          <p className="streak-ranking__hint">
            <AlertTriangle size={14} /> {error}
          </p>
        )}

        {!loading && !error && data.length === 0 && (
          <p className="streak-ranking__hint">
            Ninguém da sua organização tem streak ativo ainda. Seja o primeiro 🔥
          </p>
        )}

        {!loading && !error && data.length > 0 && (
          <>
            {myRank > 0 && (
              <div className="streak-ranking__me">
                Você está em <strong>#{myRank}</strong> de {totalRanking}.
                {meta.myInTop
                  ? ' Você está no Top 30! 🔥'
                  : ' Suba para o Top 30 marcando seu mood todos os dias.'}
              </div>
            )}

            <ol className="streak-ranking__list">
              {data.map((entry, idx) => {
                const rank = idx + 1;
                const heat = streakHeat(entry.streak);
                return (
                  <li
                    key={entry.idPessoa || entry.name + idx}
                    className={`streak-ranking__row streak-ranking__row--${heat} ${entry.isCurrentUser ? 'streak-ranking__row--me' : ''}`}
                  >
                    <span className="streak-ranking__rank">
                      <span className="streak-ranking__trophy" aria-hidden="true">
                        {trophy(rank)}
                      </span>
                      <span className="streak-ranking__pos">#{rank}</span>
                    </span>
                    <span className="streak-ranking__avatar" aria-hidden="true">
                      {entry.initials}
                    </span>
                    <span className="streak-ranking__name">
                      {entry.name}
                      {entry.isCurrentUser && <span className="streak-ranking__me-tag">você</span>}
                    </span>
                    <span className="streak-ranking__streak">
                      <span className="streak-ranking__flame" aria-hidden="true">
                        🔥
                      </span>
                      <strong>{entry.streak}</strong>
                      <small>dias</small>
                    </span>
                  </li>
                );
              })}
            </ol>

            {meta.meExtra && (
              <>
                <div className="streak-ranking__divider" aria-hidden="true">
                  ⋯
                </div>
                <ol className="streak-ranking__list" start={meta.myPos}>
                  <li
                    className={`streak-ranking__row streak-ranking__row--${streakHeat(meta.meExtra.streak)} streak-ranking__row--me`}
                  >
                    <span className="streak-ranking__rank">
                      <span className="streak-ranking__trophy" aria-hidden="true">
                        {trophy(meta.myPos)}
                      </span>
                      <span className="streak-ranking__pos">#{meta.myPos}</span>
                    </span>
                    <span className="streak-ranking__avatar" aria-hidden="true">
                      {meta.meExtra.initials}
                    </span>
                    <span className="streak-ranking__name">
                      {meta.meExtra.name}
                      <span className="streak-ranking__me-tag">você</span>
                    </span>
                    <span className="streak-ranking__streak">
                      <span className="streak-ranking__flame" aria-hidden="true">
                        🔥
                      </span>
                      <strong>{meta.meExtra.streak}</strong>
                      <small>dias</small>
                    </span>
                  </li>
                </ol>
              </>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}

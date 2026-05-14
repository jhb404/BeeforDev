import { ModalShell } from '../../../components/ui/ModalShell';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional override — defaults to MOCK_RANKING. */
  currentUserStreak?: number;
}

interface RankingEntry {
  name: string;
  initials: string;
  streak: number;
  isCurrentUser?: boolean;
}

/**
 * Mock leaderboard pra streak de mood.
 * TODO: substituir por fetch IPC quando backend tiver `/leaderboard/streak`.
 */
const MOCK_RANKING: RankingEntry[] = [
  { name: 'Marina Silva', initials: 'MS', streak: 87 },
  { name: 'Pedro Costa', initials: 'PC', streak: 64 },
  { name: 'Ana Beatriz', initials: 'AB', streak: 52 },
  { name: 'Rafael Mendes', initials: 'RM', streak: 41 },
  { name: 'Carla Pereira', initials: 'CP', streak: 33 },
  { name: 'João Henrique', initials: 'JB', streak: 12, isCurrentUser: true },
  { name: 'Lucas Almeida', initials: 'LA', streak: 11 },
  { name: 'Beatriz Souza', initials: 'BS', streak: 9 },
  { name: 'Felipe Rocha', initials: 'FR', streak: 7 },
  { name: 'Juliana Santos', initials: 'JS', streak: 5 },
  { name: 'Marcos Oliveira', initials: 'MO', streak: 4 },
  { name: 'Patrícia Lima', initials: 'PL', streak: 3 },
];

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

export function StreakRankingModal({ open, onClose, currentUserStreak }: Props) {
  // Inject current user streak if provided + sort
  const data = MOCK_RANKING.map((u) =>
    u.isCurrentUser && currentUserStreak !== undefined ? { ...u, streak: currentUserStreak } : u,
  ).sort((a, b) => b.streak - a.streak);

  const myRank = data.findIndex((u) => u.isCurrentUser) + 1;

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
          <h2 id="streak-ranking-title">🔥 Ranking de streak</h2>
          <p className="streak-ranking__subtitle">Quem mantém o mood vivo há mais tempo no time</p>
        </div>
        <button type="button" className="secondary compact" onClick={onClose} data-sound="close">
          Fechar
        </button>
      </div>

      <div className="streak-ranking__body">
        {myRank > 0 && (
          <div className="streak-ranking__me">
            Você está em <strong>#{myRank}</strong> de {data.length}. Continue marcando seu mood
            todo dia pra subir!
          </div>
        )}

        <ol className="streak-ranking__list">
          {data.map((entry, idx) => {
            const rank = idx + 1;
            const heat = streakHeat(entry.streak);
            return (
              <li
                key={entry.name}
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

        <p className="streak-ranking__hint">
          💡 Ranking em desenvolvimento. Dados reais virão quando o backend de gamificação for
          ligado — os usuários aqui são fictícios pra ilustrar.
        </p>
      </div>
    </ModalShell>
  );
}

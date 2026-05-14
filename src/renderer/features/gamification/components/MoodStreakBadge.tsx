import { useState } from 'react';
import { useGamification } from '../useGamification';
import { StreakRankingModal } from './StreakRankingModal';

interface Props {
  /** Renders inline (default) or as floating chip. */
  variant?: 'inline' | 'chip';
}

/**
 * Mostra a streak de mood com chama animada. Clique → abre leaderboard mock.
 */
export function MoodStreakBadge({ variant = 'inline' }: Props) {
  const { stats } = useGamification();
  const streak = stats.moodStreak;
  const [rankingOpen, setRankingOpen] = useState(false);

  if (streak <= 0) return null;

  const heat = streak >= 30 ? 'inferno' : streak >= 14 ? 'hot' : streak >= 7 ? 'warm' : 'spark';

  return (
    <>
      <button
        type="button"
        className={`mood-streak mood-streak--${variant} mood-streak--${heat}`}
        title={`Mood preenchido por ${streak} dias. Clique para ver o ranking.`}
        aria-label={`${streak} dias de streak — abrir ranking`}
        onClick={() => setRankingOpen(true)}
        data-sound="streak-open"
      >
        <span className="mood-streak__flame" aria-hidden="true">
          🔥
        </span>
        <span className="mood-streak__count">{streak}</span>
        <span className="mood-streak__label">dias</span>
      </button>
      <StreakRankingModal
        open={rankingOpen}
        onClose={() => setRankingOpen(false)}
        currentUserStreak={streak}
      />
    </>
  );
}

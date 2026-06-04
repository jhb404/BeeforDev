import { useState } from 'react';
import { StreakRankingModal } from './StreakRankingModal';
import { useRealMoodStreak } from '../hooks/useRealMoodStreak';

interface Props {
  /** Renders inline (default) or as floating chip. */
  variant?: 'inline' | 'chip';
}

/**
 * Mostra a streak REAL de mood (via /Home/MoodStreakOrganizacao, cache SWR).
 * Clique → abre ranking org.
 */
export function MoodStreakBadge({ variant = 'inline' }: Props) {
  const { streak, loading } = useRealMoodStreak();
  const [rankingOpen, setRankingOpen] = useState(false);

  if (loading || streak <= 0) return null;

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

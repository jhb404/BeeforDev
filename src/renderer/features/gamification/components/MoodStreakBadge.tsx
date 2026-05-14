import { useGamification } from '../useGamification';

interface Props {
  /** Renders inline (default) or as floating chip. */
  variant?: 'inline' | 'chip';
}

/**
 * Mostra a streak de mood com chama animada.
 * Quando backend chegar, troca pra hidratar via IPC stats.
 */
export function MoodStreakBadge({ variant = 'inline' }: Props) {
  const { stats } = useGamification();
  const streak = stats.moodStreak;
  if (streak <= 0) return null;

  const heat = streak >= 30 ? 'inferno' : streak >= 14 ? 'hot' : streak >= 7 ? 'warm' : 'spark';

  return (
    <div
      className={`mood-streak mood-streak--${variant} mood-streak--${heat}`}
      title={`Mood preenchido por ${streak} dias seguidos!`}
      role="status"
      aria-label={`${streak} dias de streak de mood`}
    >
      <span className="mood-streak__flame" aria-hidden="true">
        🔥
      </span>
      <span className="mood-streak__count">{streak}</span>
      <span className="mood-streak__label">dias</span>
    </div>
  );
}

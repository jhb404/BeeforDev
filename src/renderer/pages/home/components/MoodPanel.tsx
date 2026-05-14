import type { Mood } from '@shared/types';
import { FunnyLoader } from '../../../components/common/FunnyLoader';
import { MoodPicker } from './MoodPicker';
import { MoodStreakBadge } from '../../../features/gamification/components/MoodStreakBadge';

interface MoodPanelProps {
  loading: boolean;
  currentMood: Mood | null;
  busy: boolean;
  ready: boolean;
  onSelect: (m: Mood) => void;
}

export function MoodPanel({ loading, currentMood, busy, ready, onSelect }: MoodPanelProps) {
  return (
    <section className="home-commandbar">
      <div className={`mood-panel ${loading ? 'mood-panel--loading' : ''}`}>
        {loading ? (
          <FunnyLoader title="Buscando mood" />
        ) : (
          <>
            <div className="mood-panel__info">
              <span className="label">Mood do dia</span>
              <div className="mood-panel__row">
                <strong>{currentMood ?? 'Não identificado'}</strong>
                <MoodStreakBadge />
              </div>
            </div>
            <MoodPicker current={currentMood} disabled={busy || !ready} onSelect={onSelect} />
          </>
        )}
      </div>
    </section>
  );
}

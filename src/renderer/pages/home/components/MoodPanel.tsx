import type { Mood } from '@shared/types/index';
import { FunnyLoader } from '../../../components/common/FunnyLoader';
import { Moon } from '../../../components/common/Icons';
import { MoodPicker } from './MoodPicker';
import { MoodStreakBadge } from '../../../features/gamification/components/MoodStreakBadge';

const MOOD_START_H = 8;
const MOOD_END_H = 18;

function isMoodWindowOpen(): boolean {
  const h = new Date().getHours();
  return h >= MOOD_START_H && h < MOOD_END_H;
}

interface MoodPanelProps {
  loading: boolean;
  currentMood: Mood | null;
  busy: boolean;
  ready: boolean;
  onSelect: (m: Mood) => void;
}

export function MoodPanel({ loading, currentMood, busy, ready, onSelect }: MoodPanelProps) {
  const moodOpen = isMoodWindowOpen();
  const showOverlay = !loading && !moodOpen;

  return (
    <section className="home-commandbar">
      <div
        className={`mood-panel ${loading ? 'mood-panel--loading' : ''} ${showOverlay ? 'mood-panel--locked' : ''}`}
      >
        {loading ? (
          <FunnyLoader title="Buscando mood" />
        ) : (
          <>
            <div className="mood-panel__info">
              <span className="label">Mood do dia</span>
              <div className="mood-panel__row">
                <strong className="mood-panel__mood-text">
                  {currentMood ?? <span className="mood-panel__unidentified">—</span>}
                </strong>
                <MoodStreakBadge />
              </div>
            </div>
            <MoodPicker
              current={currentMood}
              disabled={busy || !ready || !moodOpen}
              onSelect={onSelect}
            />
            {showOverlay && (
              <div
                className="mood-panel__lock-overlay"
                role="status"
                aria-label={`Mood disponível das ${MOOD_START_H}h às ${MOOD_END_H}h`}
              >
                <span className="mood-panel__lock-pill">
                  <Moon size={14} aria-hidden="true" />
                  Mood disponível das {MOOD_START_H}h às {MOOD_END_H}h
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

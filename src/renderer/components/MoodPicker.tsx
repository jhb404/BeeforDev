import { MOODS, type Mood } from '../../shared/types';

const EMOJI: Record<Mood, string> = {
  'Dia feliz': '😄',
  'Dia bom': '🙂',
  'Dia não tão bom': '😕',
  'Dia triste': '😢',
};

interface Props {
  current: Mood | null;
  onSelect: (m: Mood) => Promise<void> | void;
  disabled?: boolean;
}

export function MoodPicker({ current, onSelect, disabled }: Props) {
  return (
    <div className="mood-grid">
      {MOODS.map((m) => (
        <button
          key={m}
          className={current === m ? 'active' : ''}
          disabled={disabled}
          onClick={() => onSelect(m)}
        >
          <span className="mood-emoji">{EMOJI[m]}</span>
          <span className="mood-label">{m}</span>
        </button>
      ))}
    </div>
  );
}

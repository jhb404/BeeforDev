import { TrophyIcon, CheckpointsIcon, ActionIcon, SentimentIcon } from './icons';

type IconKind = 'trophy' | 'check' | 'action' | 'sentiment';

interface Props {
  iconKind: IconKind;
  value: string | number;
  label: string;
  onClick?: () => void;
}

const ICONS: Record<IconKind, { cls: string; node: React.ReactNode }> = {
  trophy: { cls: 'pfx-stat__icon--trophy', node: <TrophyIcon /> },
  check: { cls: 'pfx-stat__icon--check', node: <CheckpointsIcon /> },
  action: { cls: 'pfx-stat__icon--action', node: <ActionIcon /> },
  sentiment: { cls: 'pfx-stat__icon--sentiment', node: <SentimentIcon /> },
};

/** Mini-card de métrica (troféu, checkpoints, ação). Vira botão se `onClick`. */
export function StatsCard({ iconKind, value, label, onClick }: Props) {
  const { cls, node } = ICONS[iconKind];
  const inner = (
    <>
      <span className={`pfx-stat__icon ${cls}`}>{node}</span>
      <span className="pfx-stat__num">{value}</span>
      <span className="pfx-stat__lbl">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="pfx-stat"
        onClick={onClick}
        title={label}
        aria-label={label}
        data-sound="click"
      >
        {inner}
      </button>
    );
  }
  return <div className="pfx-stat">{inner}</div>;
}

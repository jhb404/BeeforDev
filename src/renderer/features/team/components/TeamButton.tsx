import { Users } from '../../../components/common/Icons';

interface Props {
  onOpen: () => void;
  partyCount?: number;
}

export function TeamButton({ onOpen, partyCount = 0 }: Props) {
  return (
    <button
      type="button"
      className="icon-btn team-button"
      aria-label="Meu Time"
      title="Meu Time"
      onClick={onOpen}
      data-sound="team-open"
    >
      <Users size={18} />
      {partyCount > 0 && (
        <span
          className="team-button__badge"
          aria-label={`${partyCount} aniversariante${partyCount > 1 ? 's' : ''} hoje`}
        >
          {partyCount > 9 ? '9+' : partyCount}
        </span>
      )}
    </button>
  );
}

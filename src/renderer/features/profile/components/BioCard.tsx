import { PfxCard } from './PfxCard';

interface Props {
  bio?: string;
  editing?: boolean;
  onChange?: (value: string) => void;
}

/** Card de mini biografia do usuário. Em modo edição vira textarea controlado. */
export function BioCard({ bio, editing = false, onChange }: Props) {
  return (
    <PfxCard title="📝 Mini bio">
      {editing ? (
        <textarea
          className="pfx-bio-input"
          value={bio ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Conte um pouco sobre você!"
          rows={2}
          maxLength={1000}
        />
      ) : (
        <p className="pfx-bio">{bio?.trim() || 'Sem bio ainda. Conte um pouco sobre você!'}</p>
      )}
    </PfxCard>
  );
}

import { PfxCard } from './PfxCard';

interface Props {
  bio?: string;
}

/** Card de mini biografia do usuário. */
export function BioCard({ bio }: Props) {
  return (
    <PfxCard title="📝 Mini bio">
      <p className="pfx-bio">{bio?.trim() || 'Sem bio ainda. Conte um pouco sobre você!'}</p>
    </PfxCard>
  );
}

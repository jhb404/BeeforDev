interface Props {
  active: boolean;
  size?: 'sm' | 'md';
}

export function TeamStatusBadge({ active, size = 'sm' }: Props) {
  return (
    <span
      className={`team-status team-status--${active ? 'on' : 'off'} team-status--${size}`}
      aria-label={active ? 'Ativo' : 'Inativo'}
      title={active ? 'Ativo' : 'Inativo'}
    >
      <span className="team-status__dot" aria-hidden="true" />
      {active ? 'Ativo' : 'Inativo'}
    </span>
  );
}

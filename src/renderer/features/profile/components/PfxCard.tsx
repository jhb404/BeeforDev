import type { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
  wide?: boolean;
}

/** Card base do perfil, com título e corpo. `wide` ocupa a linha inteira do grid. */
export function PfxCard({ title, children, wide }: Props) {
  return (
    <section className={`pfx-card ${wide ? 'pfx-card--wide' : ''}`}>
      <h3 className="pfx-card__title">{title}</h3>
      <div className="pfx-card__body">{children}</div>
    </section>
  );
}

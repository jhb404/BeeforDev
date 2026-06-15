import type { ReactNode } from 'react';

export function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="ativ-drawer__empty-state">
      <span>{icon}</span>
      <p>{text}</p>
    </div>
  );
}

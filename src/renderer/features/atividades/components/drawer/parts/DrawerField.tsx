import type { ReactNode } from 'react';

export function EditRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ativ-drawer__field">
      <span className="ativ-drawer__field-label">{label}</span>
      {children}
    </div>
  );
}

export function DrawerField({
  label,
  value,
  placeholder,
}: {
  label: string;
  value: string | null | undefined;
  placeholder?: string;
}) {
  return (
    <div className="ativ-drawer__field">
      <span className="ativ-drawer__field-label">{label}</span>
      <span
        className={`ativ-drawer__field-value ${!value ? 'ativ-drawer__field-value--empty' : ''}`}
      >
        {value ?? placeholder ?? '—'}
      </span>
    </div>
  );
}

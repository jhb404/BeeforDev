interface SwitchProps {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Switch({ id, checked, onChange, label, disabled }: SwitchProps) {
  return (
    <div className="switch-row" style={{ marginBottom: 10 }}>
      <span className="switch">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="switch__track" />
        <span className="switch__thumb" />
      </span>
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

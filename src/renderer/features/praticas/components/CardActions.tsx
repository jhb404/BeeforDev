interface Action {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

/** Footer de ações dos cards (Adicionar / Detalhes / Editar / Realizar). */
export function CardActions({ actions }: { actions: Action[] }) {
  if (!actions.length) return null;
  return (
    <div className="praticas-card-actions">
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          className={`praticas-action-btn${a.primary ? ' primary' : ''}`}
          onClick={a.onClick}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}

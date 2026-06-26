interface CardActionsProps {
  /** Botão "+" circular (Adicionar). */
  onAdd?: () => void;
  /** Botão "Editar" (rodapé esquerda). */
  onEdit?: () => void;
  /** Botão "Detalhes" (rodapé direita — padrão de todos os cards). */
  onDetails?: () => void;
  addTitle?: string;
}

/**
 * Rodapé padrão dos cards. Detalhes SEMPRE à direita; Editar à esquerda;
 * Adicionar é um "+" circular destacado.
 */
export function CardActions({
  onAdd,
  onEdit,
  onDetails,
  addTitle = 'Adicionar',
}: CardActionsProps) {
  if (!onAdd && !onEdit && !onDetails) return null;
  return (
    <div className="praticas-card-footer">
      <div className="praticas-card-footer-left">
        {onAdd && (
          <button
            type="button"
            className="praticas-add-btn"
            onClick={onAdd}
            title={addTitle}
            aria-label={addTitle}
          >
            +
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            className="praticas-edit-btn"
            onClick={onEdit}
            title="Editar"
            aria-label="Editar"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
            Editar
          </button>
        )}
      </div>
      {onDetails && (
        <button type="button" className="praticas-footer-link" onClick={onDetails}>
          Detalhes
        </button>
      )}
    </div>
  );
}

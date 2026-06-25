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
          <button type="button" className="praticas-footer-link" onClick={onEdit}>
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

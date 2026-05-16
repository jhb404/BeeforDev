import type { BeeforAtividade } from '@shared/types/index';
import {
  TIPO_ICON,
  TIPO_LABEL,
  formatDate,
  getMomentoClass,
} from '../utils/atividadeDisplay';

interface Props {
  atividades: BeeforAtividade[];
  selectedId: string | null;
  onSelect: (atividade: BeeforAtividade) => void;
}

export function AtividadeList({ atividades, selectedId, onSelect }: Props) {
  return (
    <div className="atividades-list">
      {atividades.map((a) => (
        <button
          key={a.id}
          type="button"
          className={`atividade-card ${selectedId === a.id ? 'atividade-card--active' : ''}`}
          onClick={() => onSelect(a)}
          data-sound="calendar-pick"
          aria-pressed={selectedId === a.id}
        >
          <div className="atividade-card__header">
            <span className="atividade-card__numero">{a.numeroCard}</span>
            <span className={`atividade-card__momento ${getMomentoClass(a.momento)}`}>
              {a.momento}
            </span>
          </div>
          <p className="atividade-card__nome">{a.nome}</p>
          <div className="atividade-card__meta">
            <span className="atividade-card__tipo">
              {TIPO_ICON[a.tipo] ?? ''} {TIPO_LABEL[a.tipo] ?? `Tipo ${a.tipo}`}
            </span>
            <span className="atividade-card__sep">·</span>
            <span className="atividade-card__board">{a.timeBoard}</span>
            {a.projeto !== 'Sem projeto' && (
              <>
                <span className="atividade-card__sep">·</span>
                <span className="atividade-card__projeto">{a.projeto}</span>
              </>
            )}
            <span className="atividade-card__sep">·</span>
            <span className="atividade-card__data">{formatDate(a.dataCriacao)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

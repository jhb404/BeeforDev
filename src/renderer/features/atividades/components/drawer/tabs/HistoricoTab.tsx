import { FileText } from '../../../../../components/common/Icons';
import type { UseCardInteracoesResult } from '../../../hooks/useCardInteracoes';
import { formatDate } from '../../../utils/atividadeDisplay';
import { EmptyState } from '../parts/EmptyState';

export function HistoricoTab({ interacoes }: { interacoes: UseCardInteracoesResult }) {
  return (
    <div className="ativ-drawer__section ativ-drawer__tab-content">
      {interacoes.logs.length > 0 ? (
        <div className="ativ-drawer__history">
          {interacoes.logs.map((h, i) => (
            <div key={i} className="ativ-drawer__history-item">
              <span className="ativ-drawer__history-dot" />
              <div>
                <span className="ativ-drawer__history-action">{h.acao}</span>
                <span className="ativ-drawer__history-meta">
                  {h.usuario}
                  {h.usuario && h.data ? ' · ' : ''}
                  {h.data ? formatDate(h.data) : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !interacoes.loadingLogs && (
          <EmptyState icon={<FileText size={24} />} text="Nenhuma atividade registrada." />
        )
      )}
    </div>
  );
}

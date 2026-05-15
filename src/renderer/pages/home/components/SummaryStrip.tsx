import { Bolt, Calendar, Clock, Trophy } from '../../../components/common/Icons';
import { formatMinutes } from '../../../utils/timeMath';

export interface SummaryStripData {
  workedTotal: number;
  saldoTotal: number;
  workedDays: number;
  avgDayMin: number;
  bestDayMin: number;
}

interface SummaryStripProps {
  summary: SummaryStripData;
  compact?: boolean;
}

export function SummaryStrip({ summary, compact }: SummaryStripProps) {
  return (
    <div className={`summary-strip ${compact ? 'compact' : ''}`}>
      <div className="summary-card">
        <span className="summary-label">
          <Clock size={14} /> Horas trabalhadas
        </span>
        <strong className="summary-value">{formatMinutes(summary.workedTotal)}</strong>
      </div>
      <div className="summary-card">
        <span className="summary-label">
          <Calendar size={14} /> Dias trabalhados
        </span>
        <strong className="summary-value">{summary.workedDays}d</strong>
      </div>
      <div className={`summary-card ${summary.saldoTotal >= 0 ? 'pos' : 'neg'}`}>
        <span className="summary-label">
          <Bolt size={14} /> Saldo do mês
        </span>
        <strong className="summary-value">{formatMinutes(summary.saldoTotal, true)}</strong>
      </div>
      <div className="summary-card">
        <span className="summary-label">
          <Clock size={14} /> Média diária
        </span>
        <strong className="summary-value">
          {summary.workedDays > 0 ? formatMinutes(summary.avgDayMin) : '--:--'}
        </strong>
      </div>
      <div className="summary-card">
        <span className="summary-label">
          <Trophy size={14} /> Melhor dia
        </span>
        <strong className="summary-value">
          {summary.bestDayMin > 0 ? formatMinutes(summary.bestDayMin) : '--:--'}
        </strong>
      </div>
    </div>
  );
}

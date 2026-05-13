import { Bolt, Calendar, Clock, Heart, Trophy } from '../../../components/common/Icons';
import { formatMinutes } from '../../../utils/timeMath';

export interface SummaryStripData {
  workedTotal: number;
  expectedTotal: number;
  saldoTotal: number;
  overtimeMin: number;
  overtimeValue: number;
  totalSalary: number;
  workedDays: number;
}

interface SummaryStripProps {
  summary: SummaryStripData;
  compact?: boolean;
  showOvertimeValue?: boolean;
  showTotalSalary?: boolean;
}

const BRL = { style: 'currency' as const, currency: 'BRL' };

export function SummaryStrip({
  summary,
  compact,
  showOvertimeValue = true,
  showTotalSalary = true,
}: SummaryStripProps) {
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
          <Calendar size={14} /> Horas previstas
        </span>
        <strong className="summary-value">{formatMinutes(summary.expectedTotal)}</strong>
      </div>
      <div className={`summary-card ${summary.saldoTotal >= 0 ? 'pos' : 'neg'}`}>
        <span className="summary-label">
          <Bolt size={14} /> Saldo do mês
        </span>
        <strong className="summary-value">{formatMinutes(summary.saldoTotal, true)}</strong>
      </div>
      <div className="summary-card">
        <span className="summary-label">
          <Bolt size={14} /> Dias trabalhados
        </span>
        <strong className="summary-value">{summary.workedDays}d</strong>
      </div>
      {showOvertimeValue && (
        <div className={`summary-card ${summary.overtimeMin > 0 ? 'pos' : ''}`}>
          <span className="summary-label">
            <Trophy size={14} /> Valor extras
          </span>
          <strong className="summary-value">
            {summary.overtimeValue.toLocaleString('pt-BR', BRL)}
          </strong>
        </div>
      )}
      {showTotalSalary && (
        <div className="summary-card">
          <span className="summary-label">
            <Heart size={14} /> Total estimado
          </span>
          <strong className="summary-value">
            {summary.totalSalary.toLocaleString('pt-BR', BRL)}
          </strong>
        </div>
      )}
    </div>
  );
}

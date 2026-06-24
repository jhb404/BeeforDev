/** Primitivo de barras em SVG puro — sem lib. */
interface BarChartProps {
  data: Array<{ legenda: string; valor: number }>;
  /** Linha de meta opcional (ex.: throughput planejado). */
  meta?: number;
  height?: number;
  color?: string;
  unidade?: string;
}

export function BarChart({
  data,
  meta,
  height = 140,
  color = 'var(--warm, #f5871f)',
  unidade = '',
}: BarChartProps) {
  if (!data.length) {
    return <div className="praticas-chart-empty">Sem dados no período.</div>;
  }
  const W = 320;
  const H = height;
  const padBottom = 22;
  const padTop = 8;
  const max = Math.max(meta ?? 0, ...data.map((d) => d.valor), 1);
  const innerH = H - padBottom - padTop;
  const gap = 6;
  const barW = (W - gap * (data.length + 1)) / data.length;
  const y = (v: number) => padTop + innerH - (v / max) * innerH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img">
      {meta !== undefined && meta > 0 && (
        <line
          x1={0}
          x2={W}
          y1={y(meta)}
          y2={y(meta)}
          stroke="var(--danger, #e5484d)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
      )}
      {data.map((d, i) => {
        const x = gap + i * (barW + gap);
        const bh = Math.max(0, innerH - (y(d.valor) - padTop));
        return (
          <g key={i}>
            <rect x={x} y={y(d.valor)} width={barW} height={bh} rx={3} fill={color}>
              <title>{`${d.legenda}: ${d.valor}${unidade}`}</title>
            </rect>
            <text
              x={x + barW / 2}
              y={H - 6}
              textAnchor="middle"
              fontSize={9}
              fill="var(--text-muted, #888)"
            >
              {d.legenda.length > 6 ? d.legenda.slice(0, 6) : d.legenda}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

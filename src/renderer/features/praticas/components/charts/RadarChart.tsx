/** Radar (teia) SVG. Eixos = competências, valor 0..max. */
interface RadarChartProps {
  eixos: Array<{ rotulo: string; valor: number }>;
  max?: number;
  size?: number;
  color?: string;
}

export function RadarChart({
  eixos,
  max = 10,
  size = 220,
  color = 'var(--warm, #f5871f)',
}: RadarChartProps) {
  const n = eixos.length;
  if (n < 3) return <div className="praticas-chart-empty">Radar precisa de 3+ eixos.</div>;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 28;

  const pt = (i: number, frac: number) => {
    const ang = (i / n) * 2 * Math.PI - Math.PI / 2;
    return [cx + r * frac * Math.cos(ang), cy + r * frac * Math.sin(ang)];
  };

  const grades = [0.25, 0.5, 0.75, 1];
  const poly = eixos
    .map((e, i) => pt(i, Math.max(0, Math.min(1, e.valor / max))))
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height={size} role="img">
      {grades.map((g, gi) => (
        <polygon
          key={gi}
          points={eixos
            .map((_, i) => pt(i, g))
            .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
            .join(' ')}
          fill="none"
          stroke="var(--border, #333)"
          strokeWidth={0.5}
        />
      ))}
      {eixos.map((e, i) => {
        const [x, y] = pt(i, 1);
        const [lx, ly] = pt(i, 1.18);
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border, #333)" strokeWidth={0.5} />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fill="var(--text-muted, #999)"
            >
              {e.rotulo.length > 12 ? e.rotulo.slice(0, 12) : e.rotulo}
            </text>
          </g>
        );
      })}
      <polygon points={poly} fill={color} fillOpacity={0.35} stroke={color} strokeWidth={2} />
    </svg>
  );
}

/** Primitivo de linha (com baseline opcional) em SVG puro — sem lib. */
interface LineChartProps {
  legenda: string[];
  serie: number[];
  /** Série de baseline pontilhada (ex.: média/meta). */
  baseline?: number[];
  height?: number;
  color?: string;
}

function path(values: number[], x: (i: number) => number, y: (v: number) => number): string {
  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(' ');
}

export function LineChart({
  legenda,
  serie,
  baseline,
  height = 140,
  color = 'var(--warm, #f5871f)',
}: LineChartProps) {
  if (!serie.length) {
    return <div className="praticas-chart-empty">Sem série.</div>;
  }
  const W = 320;
  const H = height;
  const pad = 10;
  const padBottom = 22;
  const all = [...serie, ...(baseline ?? [])];
  const max = Math.max(...all, 1);
  const min = Math.min(...all, 0);
  const innerH = H - padBottom - pad;
  const x = (i: number) => pad + (i / Math.max(serie.length - 1, 1)) * (W - pad * 2);
  const y = (v: number) => pad + innerH - ((v - min) / Math.max(max - min, 1)) * innerH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img">
      {baseline && baseline.length > 0 && (
        <path
          d={path(baseline, x, y)}
          fill="none"
          stroke="var(--text-muted, #888)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
      )}
      <path d={path(serie, x, y)} fill="none" stroke={color} strokeWidth={2} />
      {serie.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={2.5} fill={color}>
          <title>{`${legenda[i] ?? i}: ${v}`}</title>
        </circle>
      ))}
    </svg>
  );
}

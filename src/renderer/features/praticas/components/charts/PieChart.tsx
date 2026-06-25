/** Donut SVG centralizado, legenda abaixo. Suporta cor por-fatia e fatia única. */
interface Fatia {
  rotulo: string;
  valor: number;
  cor?: string;
}
interface PieChartProps {
  data: Fatia[];
  size?: number;
  cores?: string[];
  donut?: boolean;
}

const CORES_PADRAO = [
  'var(--chart-3)',
  'var(--chart-5)',
  'var(--chart-4)',
  'var(--chart-2)',
  'var(--chart-1)',
  'var(--chart-6)',
  'var(--text-muted)',
];

export function PieChart({ data, size = 170, cores = CORES_PADRAO, donut = true }: PieChartProps) {
  const total = data.reduce((s, d) => s + d.valor, 0);
  if (total <= 0) return <div className="praticas-chart-empty">Sem dados.</div>;

  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  const corDe = (d: Fatia, i: number) => d.cor || cores[i % cores.length];
  const naoZero = data.filter((d) => d.valor > 0);
  const single = naoZero.length === 1;

  let acc = 0;
  const arcs = data.map((d, i) => {
    const frac = d.valor / total;
    const a0 = acc * 2 * Math.PI - Math.PI / 2;
    acc += frac;
    const a1 = acc * 2 * Math.PI - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const large = frac > 0.5 ? 1 : 0;
    return { d, i, path: `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z` };
  });

  return (
    <div className="praticas-chart">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img">
        {single ? (
          <circle cx={cx} cy={cy} r={r} fill={corDe(naoZero[0], data.indexOf(naoZero[0]))} />
        ) : (
          arcs.map(({ d, i, path }) =>
            d.valor > 0 ? (
              <path key={i} d={path} fill={corDe(d, i)}>
                <title>{`${d.rotulo}: ${d.valor}`}</title>
              </path>
            ) : null,
          )
        )}
        {donut && <circle cx={cx} cy={cy} r={r * 0.6} fill="var(--panel-bg)" />}
      </svg>
      <ul className="praticas-legend-list">
        {data.map((d, i) => (
          <li key={i}>
            <span className="praticas-dot" style={{ background: corDe(d, i) }} />
            {d.rotulo} <strong>({d.valor})</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

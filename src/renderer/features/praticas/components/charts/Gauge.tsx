/** Gauge semicircular SVG (0..100%) — centralizado, valor grande. */
interface GaugeProps {
  valor: number | null; // 0..100
  label?: string;
  size?: number;
  color?: string;
}

export function Gauge({ valor, label, size = 200, color = 'var(--warm)' }: GaugeProps) {
  const pct = Math.max(0, Math.min(100, valor ?? 0));
  const sw = 16;
  const r = size / 2 - sw;
  const cx = size / 2;
  const cy = size / 2;
  const circ = Math.PI * r; // meio círculo
  const dash = (pct / 100) * circ;

  return (
    <div className="praticas-chart praticas-gauge">
      <svg
        viewBox={`0 0 ${size} ${size / 2 + sw}`}
        width="100%"
        style={{ maxWidth: size }}
        role="img"
      >
        <path
          d={`M ${sw} ${cy} A ${r} ${r} 0 0 1 ${size - sw} ${cy}`}
          fill="none"
          stroke="var(--chart-track)"
          strokeWidth={sw}
          strokeLinecap="round"
        />
        <path
          d={`M ${sw} ${cy} A ${r} ${r} 0 0 1 ${size - sw} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize={32}
          fontWeight={800}
          fill="var(--text)"
        >
          {valor == null ? '—' : `${Math.round(pct)}%`}
        </text>
      </svg>
      {label && <div className="praticas-card-sub praticas-chart-label">{label}</div>}
    </div>
  );
}

/** Gauge semicircular SVG (0..100%). */
interface GaugeProps {
  valor: number | null; // 0..100
  label?: string;
  size?: number;
  color?: string;
}

export function Gauge({ valor, label, size = 160, color = 'var(--warm, #f5871f)' }: GaugeProps) {
  const pct = Math.max(0, Math.min(100, valor ?? 0));
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const circ = Math.PI * r; // meio círculo
  const dash = (pct / 100) * circ;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox={`0 0 ${size} ${size / 2 + 12}`} width="100%" height={size / 2 + 12} role="img">
        <path
          d={`M 12 ${cy} A ${r} ${r} 0 0 1 ${size - 12} ${cy}`}
          fill="none"
          stroke="var(--border, #333)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        <path
          d={`M 12 ${cy} A ${r} ${r} 0 0 1 ${size - 12} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize={22}
          fontWeight={700}
          fill="var(--text, #eee)"
        >
          {valor == null ? '—' : `${Math.round(pct)}%`}
        </text>
      </svg>
      {label && <div className="praticas-card-sub">{label}</div>}
    </div>
  );
}

import type { Temperatura } from '@shared/types/index';

/** TemperaturaTermometroEnum → rótulo + cor + emoji. */
const MAP: Record<Temperatura, { label: string; color: string; emoji: string }> = {
  1: { label: 'Congelado', color: '#5b8def', emoji: '🧊' },
  2: { label: 'Frio', color: '#3fb6e8', emoji: '❄️' },
  3: { label: 'Morno', color: '#f2c037', emoji: '🌤️' },
  4: { label: 'Quente', color: '#f5871f', emoji: '🔥' },
  5: { label: 'Fervendo', color: '#e5484d', emoji: '🌋' },
};

export function TemperaturaBadge({ temperatura }: { temperatura: Temperatura | null }) {
  if (!temperatura) return null;
  const t = MAP[temperatura];
  return (
    <span
      title={`Termômetro: ${t.label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        color: '#fff',
        background: t.color,
      }}
    >
      {t.emoji} {t.label}
    </span>
  );
}

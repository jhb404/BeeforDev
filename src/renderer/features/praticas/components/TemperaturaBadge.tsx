import type { Temperatura } from '@shared/types/index';

/** TemperaturaTermometroEnum → rótulo + cor + emoji. */
const MAP: Record<Temperatura, { label: string; color: string; emoji: string }> = {
  1: { label: 'Congelado', color: 'var(--temp-1)', emoji: '🧊' },
  2: { label: 'Frio', color: 'var(--temp-2)', emoji: '❄️' },
  3: { label: 'Morno', color: 'var(--temp-3)', emoji: '🌤️' },
  4: { label: 'Quente', color: 'var(--temp-4)', emoji: '🔥' },
  5: { label: 'Fervendo', color: 'var(--temp-5)', emoji: '🌋' },
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
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-on-warm, #fff)',
        background: t.color,
      }}
    >
      {t.emoji} {t.label}
    </span>
  );
}

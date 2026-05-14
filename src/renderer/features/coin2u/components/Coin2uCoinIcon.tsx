import { useId } from 'react';

export function CoinIcon({ variant }: { variant: 'gold' | 'purple' }) {
  // Unique gradient id per render so multiple coins on the same page don't collide.
  const id = useId().replace(/[:]/g, '');
  const gradId = `coin-grad-${variant}-${id}`;

  // All colors derive from theme tokens — coin auto-tints per preset.
  // Gold variant uses warm palette; purple uses accent palette.
  const from =
    variant === 'gold'
      ? 'color-mix(in srgb, var(--warm) 80%, #fff)'
      : 'color-mix(in srgb, var(--accent) 70%, #fff)';
  const mid = variant === 'gold' ? 'var(--warm)' : 'var(--accent)';
  const edge = variant === 'gold' ? 'var(--warm-hover)' : 'var(--accent-hover)';

  return (
    <svg
      className={`coin2u-coin coin2u-coin--${variant}`}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={from} />
          <stop offset="65%" stopColor={mid} />
          <stop offset="100%" stopColor={edge} />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10.5" fill={`url(#${gradId})`} stroke={edge} strokeWidth="1" />
      <circle
        cx="12"
        cy="12"
        r="7.5"
        fill="none"
        stroke={edge}
        strokeOpacity="0.45"
        strokeWidth="0.6"
      />
      {variant === 'gold' ? (
        <path
          d="M12 7.2 L13.4 10.8 L17.2 11 L14.2 13.4 L15.2 17 L12 14.9 L8.8 17 L9.8 13.4 L6.8 11 L10.6 10.8 Z"
          fill={edge}
          opacity="0.55"
        />
      ) : (
        <path d="M12 6.5 L15.5 12 L12 17.5 L8.5 12 Z" fill={edge} opacity="0.5" />
      )}
      <ellipse cx="9.5" cy="8.5" rx="3" ry="1.6" fill="var(--button-text)" opacity="0.35" />
    </svg>
  );
}

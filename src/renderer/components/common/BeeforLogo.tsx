/**
 * Beefor logo SVG — inline component.
 * Replaced all `#FF9400` with `currentColor` so CSS `color` controls the tint.
 * Use:
 *   <BeeforLogo size={32} style={{ color: 'var(--warm)' }} />
 *   <BeeforLogo size={40} className="logo-flame" />  // CSS aplica filter/hue
 */
interface Props {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

export function BeeforLogo({ size = 32, className = '', style, title }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`beefor-logo ${className}`}
      style={style}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
    >
      <path
        d="M662.093 750.788H361.907V273.242H662.093V750.788ZM395.573 695.058H627.493V622.994H395.573V695.058ZM395.573 511.535V583.598H627.493V511.535H395.573ZM395.573 472.139H627.493V400.075H395.573V472.139Z"
        fill="currentColor"
      />
      <path d="M361.412 750.818H662.588L512 843.654L361.412 750.818Z" fill="currentColor" />
      <path d="M662.588 273.836L361.412 273.836L512 181L662.588 273.836Z" fill="currentColor" />
      <path
        d="M977.303 315.833V484.735L839.659 568.226L702.016 484.735V315.833L839.659 232.34L977.303 315.833Z"
        stroke="currentColor"
        strokeWidth="44"
      />
      <path
        d="M805.452 629.812V696.823L751.903 729.347L698.353 696.823V629.812L751.903 597.289L805.452 629.812Z"
        stroke="currentColor"
        strokeWidth="44"
      />
      <path
        d="M46.6971 315.833V484.735L184.341 568.226L321.984 484.735V315.833L184.341 232.34L46.6971 315.833Z"
        stroke="currentColor"
        strokeWidth="44"
      />
      <path
        d="M325.647 629.812V696.823L272.097 729.347L218.548 696.823V629.812L272.097 597.289L325.647 629.812Z"
        stroke="currentColor"
        strokeWidth="44"
      />
    </svg>
  );
}

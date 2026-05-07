import { useEffect, useState } from 'react';

interface Props {
  logoVariant?: 'orange' | 'purple';
  ready: boolean;
  onComplete?: () => void;
}

const MIN_VISIBLE_MS = 5000;
const MAX_VISIBLE_MS = 12000;

export function StartupOverlay({ logoVariant = 'orange', ready, onComplete }: Props) {
  const [canClose, setCanClose] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [closing, setClosing] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const minTimer = window.setTimeout(() => setCanClose(true), MIN_VISIBLE_MS);
    const maxTimer = window.setTimeout(() => setTimedOut(true), MAX_VISIBLE_MS);
    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(maxTimer);
    };
  }, []);

  useEffect(() => {
    if (!(ready || timedOut) || !canClose) return;
    setClosing(true);
    const timer = window.setTimeout(() => {
      setHidden(true);
      onComplete?.();
    }, 420);
    return () => window.clearTimeout(timer);
  }, [ready, timedOut, canClose, onComplete]);

  if (hidden) return null;

  return (
    <div className={`startup-overlay ${closing ? 'startup-overlay--closing' : ''}`} aria-hidden="true">
      <div className="startup-overlay__grid" />
      <div className="startup-overlay__mark">
        <span className="startup-overlay__ring" />
        <svg
          className={`startup-overlay__logo-svg startup-overlay__logo-svg--${logoVariant}`}
          viewBox="0 0 1024 1024"
          aria-hidden="true"
        >
          <path className="startup-overlay__svg-wing startup-overlay__svg-wing--top-left" d="M46.6971 315.833V484.735L184.341 568.226L321.984 484.735V315.833L184.341 232.34L46.6971 315.833Z" stroke="currentColor" strokeWidth="44" fill="none" />
          <path className="startup-overlay__svg-wing startup-overlay__svg-wing--bottom-left" d="M325.647 629.812V696.823L272.097 729.347L218.548 696.823V629.812L272.097 597.289L325.647 629.812Z" stroke="currentColor" strokeWidth="44" fill="none" />
          <path className="startup-overlay__svg-wing startup-overlay__svg-wing--top-right" d="M977.303 315.833V484.735L839.659 568.226L702.016 484.735V315.833L839.659 232.34L977.303 315.833Z" stroke="currentColor" strokeWidth="44" fill="none" />
          <path className="startup-overlay__svg-wing startup-overlay__svg-wing--bottom-right" d="M805.452 629.812V696.823L751.903 729.347L698.353 696.823V629.812L751.903 597.289L805.452 629.812Z" stroke="currentColor" strokeWidth="44" fill="none" />
          <g className="startup-overlay__svg-core">
            <path d="M662.093 750.788H361.907V273.242H662.093V750.788ZM395.573 695.058H627.493V622.994H395.573V695.058ZM395.573 511.535V583.598H627.493V511.535H395.573ZM395.573 472.139H627.493V400.075H395.573V472.139Z" fill="currentColor" />
            <path d="M361.412 750.818H662.588L512 843.654L361.412 750.818Z" fill="currentColor" />
            <path d="M662.588 273.836L361.412 273.836L512 181L662.588 273.836Z" fill="currentColor" />
          </g>
        </svg>
      </div>
    </div>
  );
}

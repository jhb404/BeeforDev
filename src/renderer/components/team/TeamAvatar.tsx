import { useEffect, useState } from 'react';
import { initialsOf } from '../../utils/dateUtils';

interface Props {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}

export function TeamAvatar({ name, src, size = 56, className }: Props) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  const showImg = !!src && !broken;
  const dim = `${size}px`;

  return (
    <div
      className={`team-avatar ${className ?? ''}`}
      style={{ width: dim, height: dim, fontSize: Math.round(size / 2.6) }}
      aria-hidden="true"
    >
      {showImg ? (
        <img
          src={src ?? ''}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="team-avatar__initials">{initialsOf(name)}</span>
      )}
    </div>
  );
}

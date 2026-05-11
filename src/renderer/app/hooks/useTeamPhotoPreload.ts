import { useEffect } from 'react';
import { loadMembersCache } from '../../utils/teamCache';

function preloadTeamPhotos(limit = 4) {
  const cache = loadMembersCache();
  if (!cache) return;
  const urls = Array.from(
    new Set(
      cache.members
        .map((m) => m.foto)
        .filter((src): src is string => !!src && /^https?:\/\//i.test(src)),
    ),
  );
  if (urls.length === 0) return;

  let cursor = 0;
  const loadNext = () => {
    const src = urls[cursor];
    cursor += 1;
    if (!src) return;
    const img = new Image();
    img.onload = loadNext;
    img.onerror = loadNext;
    img.referrerPolicy = 'no-referrer';
    img.src = src;
  };
  for (let i = 0; i < Math.min(limit, urls.length); i += 1) loadNext();
}

/**
 * After startup completes, kicks off background preload of up to N team photos.
 */
export function useTeamPhotoPreload(startupComplete: boolean, limit = 4): void {
  useEffect(() => {
    if (!startupComplete) return;
    const timer = window.setTimeout(() => preloadTeamPhotos(limit), 1200);
    return () => window.clearTimeout(timer);
  }, [startupComplete, limit]);
}

import { useEffect, useState } from 'react';
import { systemClient } from '../services/ipc';

export function useAppLogo(variant: 'orange' | 'purple', size: 'icon' | 'logo') {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const files =
      size === 'icon'
        ? variant === 'orange'
          ? ['icon-orange.png', 'logo-app-orange.png', 'icon.png', 'icon-128.png']
          : ['icon-purple.png', 'logo-app-purple.png', 'icon.png', 'icon-128.png']
        : variant === 'orange'
          ? ['logo-app-orange.png', 'icon-orange.png', 'icon-512.png', 'icon.png']
          : ['logo-app-purple.png', 'icon-purple.png', 'icon-512.png', 'icon.png'];

    const load = async () => {
      for (const file of files) {
        const dataUrl = await systemClient.readAsset(file);
        if (dataUrl) {
          if (!cancelled) setSrc(dataUrl);
          return;
        }
      }
      if (!cancelled) setSrc(null);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [variant, size]);

  return src;
}

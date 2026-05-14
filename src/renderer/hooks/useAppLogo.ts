import { useEffect, useState } from 'react';
import { systemClient } from '../services/ipc';

export function useAppLogo(variant: 'orange' | 'purple', size: 'icon' | 'logo') {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Variant-specific assets removed from build/ — fall back to generic icons.
    // Order matters: generic first → avoids ENOENT log spam for non-existent files.
    const files = size === 'icon' ? ['icon-128.png', 'icon.png'] : ['icon-512.png', 'icon.png'];

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

import { useEffect } from 'react';
import { windowClient } from '../services/ipc';
import { ICON_VARIANTS } from '../features/gamification';

const SIZE = 256;

/**
 * Rasterizes BeeforLogo SVG (current color + overlay) to PNG via canvas,
 * sends data URL to main → `BrowserWindow.setIcon`. Effect: Windows taskbar
 * / alt-tab / titlebar icon all update without precomputed PNGs per variant.
 *
 * Why renderer-side: SVG rasterization is free in Chromium via `<img src=svg>`
 * + canvas. Main process has no canvas API. Pre-generating PNGs at build
 * would mean N files per variant (16/32/64/128/256) × N variants = bloat.
 */
export function useAppIconSync(activeIconId: string | undefined): void {
  useEffect(() => {
    if (!activeIconId) return;
    const variant = ICON_VARIANTS.find((v) => v.id === activeIconId);
    if (!variant) return;

    // Resolve CSS vars (var(--warm), var(--accent)) to literal colors at runtime.
    const probe = document.createElement('div');
    probe.style.color = variant.color;
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    const color = resolved || '#ff9400';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
      <path fill="${color}" d="M662.093 750.788H361.907V273.242H662.093V750.788ZM395.573 695.058H627.493V622.994H395.573V695.058ZM395.573 511.535V583.598H627.493V511.535H395.573ZM395.573 472.139H627.493V400.075H395.573V472.139Z"/>
      <path fill="${color}" d="M361.412 750.818H662.588L512 843.654L361.412 750.818Z"/>
      <path fill="${color}" d="M662.588 273.836L361.412 273.836L512 181L662.588 273.836Z"/>
      <path stroke="${color}" stroke-width="44" fill="none" d="M977.303 315.833V484.735L839.659 568.226L702.016 484.735V315.833L839.659 232.34L977.303 315.833Z"/>
      <path stroke="${color}" stroke-width="44" fill="none" d="M805.452 629.812V696.823L751.903 729.347L698.353 696.823V629.812L751.903 597.289L805.452 629.812Z"/>
      <path stroke="${color}" stroke-width="44" fill="none" d="M46.6971 315.833V484.735L184.341 568.226L321.984 484.735V315.833L184.341 232.34L46.6971 315.833Z"/>
      <path stroke="${color}" stroke-width="44" fill="none" d="M325.647 629.812V696.823L272.097 729.347L218.548 696.823V629.812L272.097 597.289L325.647 629.812Z"/>
    </svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return;
      }
      ctx.drawImage(img, 0, 0, SIZE, SIZE);

      // Overlay emoji top-right (if any)
      if (variant.overlay) {
        const emojiSize = SIZE * 0.42;
        ctx.font = `${emojiSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(variant.overlay, SIZE - 6, 0);
      }

      const dataUrl = canvas.toDataURL('image/png');
      windowClient.setIcon(dataUrl);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }, [activeIconId]);
}

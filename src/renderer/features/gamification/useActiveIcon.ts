import { ICON_VARIANTS } from './iconVariants';
import { useGamification } from './useGamification';
import type { IconVariant } from './types';

/** Variante de ícone ativa do usuário (última desbloqueada, ou laranja). */
export function useActiveIcon(): { id: string; variant: IconVariant } {
  const { stats } = useGamification();
  const id = stats.unlockedIconVariantIds[stats.unlockedIconVariantIds.length - 1] ?? 'orange';
  const variant = ICON_VARIANTS.find((v) => v.id === id) ?? ICON_VARIANTS[0];
  return { id, variant };
}

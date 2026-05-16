import type { Mood } from '../../../shared/types/index';
import { Selectors } from '../beeforSelectors';

export function normalizeUiText(raw: string | null | undefined): string {
  return (raw ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function canonicalMood(raw: string | null | undefined): Mood | null {
  const normalized = normalizeUiText(raw);
  if (!normalized) return null;

  const allMoods = Object.keys(Selectors.mood.activeClassByMood) as Mood[];
  for (const mood of allMoods) {
    if (normalizeUiText(mood) === normalized) return mood;
  }

  if (normalized.includes('feliz')) return 'Dia feliz';
  if (normalized.includes('nao tao bom') || normalized.includes('nao_tao_bom')) {
    return allMoods.find((m) => normalizeUiText(m).includes('nao')) ?? null;
  }
  if (normalized.includes('dia bom') || normalized === 'bom') return 'Dia bom';
  if (normalized.includes('triste')) return 'Dia triste';
  return null;
}

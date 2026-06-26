/**
 * Contexto selecionado no OrgSwitcher (Organização / Time / Grupo).
 * Fonte única: localStorage + evento — compartilhado entre o switcher (topbar)
 * e quem consome o contexto (ex.: useTeamMembers, que filtra as pessoas pelo time).
 */

export type Selection =
  | { kind: 'org' }
  | { kind: 'team'; id: string }
  | { kind: 'group'; id: string };

export const SELECTION_KEY = 'beefor-contexto-selecionado';
export const CONTEXT_CHANGED_EVENT = 'beefor:context-changed';

export function readSelection(): Selection {
  try {
    const raw = localStorage.getItem(SELECTION_KEY);
    if (raw) {
      const sel = JSON.parse(raw) as Selection;
      if (sel && (sel.kind === 'org' || sel.kind === 'team' || sel.kind === 'group')) return sel;
    }
  } catch {
    // ignore
  }
  return { kind: 'org' };
}

/** Filtro pra API: time → idTime; grupo → idGrupo; org-wide → ambos vazios. */
export function contextFilter(sel: Selection): { idTime: string; idGrupo: string } {
  if (sel.kind === 'team') return { idTime: sel.id, idGrupo: '' };
  if (sel.kind === 'group') return { idTime: '', idGrupo: sel.id };
  return { idTime: '', idGrupo: '' };
}

/** Chave de cache por contexto — evita mostrar o time errado ao trocar. */
export function contextCacheKey(sel: Selection): string {
  if (sel.kind === 'team') return `team:${sel.id}`;
  if (sel.kind === 'group') return `group:${sel.id}`;
  return 'org';
}

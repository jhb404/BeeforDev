import { useEffect, useState } from 'react';

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

/**
 * Id do time ativo no topo; null quando o contexto é org-wide ou grupo.
 * Reage à troca no OrgSwitcher (evento) e a trocas em outra janela (storage).
 */
export function useSelectedTeamId(): string | null {
  const [teamId, setTeamId] = useState<string | null>(() => {
    const s = readSelection();
    return s.kind === 'team' ? s.id : null;
  });

  useEffect(() => {
    const update = () => {
      const s = readSelection();
      setTeamId(s.kind === 'team' ? s.id : null);
    };
    window.addEventListener(CONTEXT_CHANGED_EVENT, update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener(CONTEXT_CHANGED_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return teamId;
}

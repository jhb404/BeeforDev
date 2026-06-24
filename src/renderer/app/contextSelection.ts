import { useEffect, useState } from 'react';

/**
 * Seleção de contexto global (Organização / Time / Grupo) escolhida no OrgSwitcher
 * do topo. Persistida em localStorage + evento, sem reload. Consumida por qualquer
 * tela que precise reagir ao time ativo (ex.: gráficos de Práticas Ágeis).
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

/** id do time ativo no topo; null quando o contexto é org-wide ou grupo. */
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
    window.addEventListener('storage', update); // troca em outra janela
    return () => {
      window.removeEventListener(CONTEXT_CHANGED_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return teamId;
}

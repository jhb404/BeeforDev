import { useCallback, useEffect, useRef, useState } from 'react';
import { Check } from '../../components/common/Icons';

/**
 * Botão de organização atual (chip) + popover de troca de org / time / grupo.
 *
 * Espelha o goobeeteams:
 *  - Trocar ORG → `org.switch` pega token novo escopado no main + invalida caches → reload da UI.
 *  - Contexto (Organização / Time / Grupo) → estado local (localStorage + evento), sem reload.
 *  - Favoritar time via API.
 */

interface OrgItem {
  idOrganizacao: string;
  nomeOrganizacao: string;
  imagem?: string;
}

interface TeamItem {
  id: string;
  nome: string;
  favorito: boolean;
  idGrupo?: string;
  logo?: string;
}

interface GroupItem {
  idGrupo: string;
  nome: string;
}

type Selection = { kind: 'org' } | { kind: 'team'; id: string } | { kind: 'group'; id: string };

const SELECTION_KEY = 'beefor-contexto-selecionado';
const CONTEXT_CHANGED_EVENT = 'beefor:context-changed';

const AVATAR_COLORS = [
  '#7c5cbf',
  '#ff9400',
  '#42d6a4',
  '#7c83ff',
  '#f55c7a',
  '#3aa6ff',
  '#ffb060',
  '#23b5a8',
];

function initials(name: string): string {
  const words = (name || '?').trim().split(/\s+/);
  if (words.length > 1) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return words[0].slice(0, 2).toUpperCase();
}

/** Cor determinística a partir do id — estável entre renders/sessões. */
function colorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function readSelection(): Selection {
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

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Avatar de time: logo se houver, senão iniciais sobre cor determinística. */
function TeamAvatar({ team }: { team: TeamItem }) {
  const [broken, setBroken] = useState(false);
  if (team.logo && !broken) {
    return (
      <img
        className="org-switcher__team-logo"
        src={team.logo}
        alt=""
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span
      className="org-switcher__avatar org-switcher__avatar--sm"
      style={{ background: colorFor(team.id) }}
    >
      {initials(team.nome)}
    </span>
  );
}

export function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string>('—');
  const [selection, setSelection] = useState<Selection>(readSelection());
  const [orgQuery, setOrgQuery] = useState('');
  const [ctxQuery, setCtxQuery] = useState('');
  const [timesOpen, setTimesOpen] = useState(true);
  const [gruposOpen, setGruposOpen] = useState(true);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const http = typeof window !== 'undefined' ? window.beeforHttp : undefined;

  const loadTeams = useCallback(async () => {
    if (!http) return;
    try {
      const res = await http.team.list();
      if (res.ok && Array.isArray(res.data)) setTeams(res.data);
    } catch {
      // silencioso
    }
  }, [http]);

  // Carga inicial: orgs + sessão (org ativa) + times + grupos.
  useEffect(() => {
    if (!http) return;
    let cancelled = false;

    // Cada chamada isolada: uma indisponível (ex.: preload sem restart) não derruba as outras.
    const safe = async <T,>(fn: () => Promise<T>, onOk: (v: T) => void) => {
      try {
        const v = await fn();
        if (!cancelled) onOk(v);
      } catch {
        // silencioso
      }
    };

    void safe(
      () => http.org.list(),
      (res) => {
        if (res.ok && Array.isArray(res.data)) setOrgs(res.data as OrgItem[]);
      },
    );
    void safe(
      () => http.sessionInfo(),
      (res) => {
        if (res.ok && res.data?.idOrganizacao) setActiveOrgId(res.data.idOrganizacao);
      },
    );
    void safe(
      () => http.team.groups(),
      (res) => {
        if (res.ok && Array.isArray(res.data)) setGroups(res.data);
      },
    );
    void loadTeams();

    return () => {
      cancelled = true;
    };
  }, [http, loadTeams]);

  // Resolve nome da org ativa quando orgs/sessão chegam.
  useEffect(() => {
    const org = orgs.find((o) => o.idOrganizacao === activeOrgId) ?? orgs[0];
    if (org) setOrgName(org.nomeOrganizacao);
  }, [orgs, activeOrgId]);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Limpa buscas ao fechar.
  useEffect(() => {
    if (!open) {
      setOrgQuery('');
      setCtxQuery('');
    }
  }, [open]);

  const activeOrg = orgs.find((o) => o.idOrganizacao === activeOrgId) ?? orgs[0] ?? null;
  const orgId = activeOrg?.idOrganizacao ?? '';
  const favoriteTeam = teams.find((t) => t.favorito) ?? null;

  const activeTeam = selection.kind === 'team' ? teams.find((t) => t.id === selection.id) : null;
  const activeGroup =
    selection.kind === 'group' ? groups.find((g) => g.idGrupo === selection.id) : null;

  const contextLabel = activeTeam?.nome ?? activeGroup?.nome ?? `${orgName} (Todos)`;

  const filteredOrgs = orgs.filter((o) => norm(o.nomeOrganizacao).includes(norm(orgQuery.trim())));
  // Favorito tem slot próprio no topo — fora da lista de Times (espelha removerTimeFavoritadoDaLista).
  const filteredTeams = teams.filter(
    (t) => !t.favorito && norm(t.nome).includes(norm(ctxQuery.trim())),
  );
  const filteredGroups = groups.filter((g) => norm(g.nome).includes(norm(ctxQuery.trim())));

  const applySelection = (sel: Selection) => {
    setSelection(sel);
    try {
      localStorage.setItem(SELECTION_KEY, JSON.stringify(sel));
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent(CONTEXT_CHANGED_EVENT, { detail: sel }));
    setOpen(false);
  };

  const handleSwitchOrg = async (id: string) => {
    if (!http || id === activeOrgId || switching) return;
    setSwitching(true);
    try {
      const res = await http.org.switch(id);
      if (res.ok) {
        // Paridade com goobeeteams: token já trocado no main → recarrega a UI limpa.
        localStorage.removeItem(SELECTION_KEY);
        window.location.reload();
        return;
      }
    } catch {
      // falhou — reabilita
    }
    setSwitching(false);
  };

  const handleToggleFavorite = async (id: string) => {
    if (!http) return;
    const isFav = favoriteTeam?.id === id;
    setTeams((prev) => prev.map((t) => ({ ...t, favorito: !isFav && t.id === id })));
    try {
      if (isFav) await http.team.unfavorite();
      else await http.team.favorite(id);
    } finally {
      await loadTeams();
    }
  };

  const isOrgWide = selection.kind === 'org';

  return (
    <div className="org-switcher" ref={ref}>
      <button
        type="button"
        className={`org-switcher__chip${open ? ' is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Trocar organização, time ou grupo"
        data-sound="click"
        disabled={switching}
      >
        <span className="org-switcher__avatar" style={{ background: colorFor(orgId) }}>
          {initials(orgName)}
        </span>
        <span className="org-switcher__labels">
          <strong className="org-switcher__org">{orgName}</strong>
          <span className="org-switcher__team">{contextLabel}</span>
        </span>
        <span className="org-switcher__caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="org-switcher__panel" role="menu">
          {/* ─── Organização ─── */}
          <div className="org-switcher__section">
            <p className="org-switcher__section-title">Organização</p>
            <input
              type="text"
              className="org-switcher__search"
              placeholder="Buscar organização…"
              value={orgQuery}
              onChange={(e) => setOrgQuery(e.target.value)}
              aria-label="Buscar organização"
            />
            <div className="org-switcher__orgs">
              {filteredOrgs.length === 0 && (
                <p className="org-switcher__empty">Nenhuma organização encontrada</p>
              )}
              {filteredOrgs.map((o) => (
                <button
                  key={o.idOrganizacao}
                  type="button"
                  className={`org-switcher__org-item${
                    o.idOrganizacao === activeOrgId ? ' is-active' : ''
                  }`}
                  onClick={() => handleSwitchOrg(o.idOrganizacao)}
                  role="menuitemradio"
                  aria-checked={o.idOrganizacao === activeOrgId}
                  disabled={switching}
                >
                  <span
                    className="org-switcher__avatar org-switcher__avatar--sm"
                    style={{ background: colorFor(o.idOrganizacao) }}
                  >
                    {initials(o.nomeOrganizacao)}
                  </span>
                  <span>{o.nomeOrganizacao}</span>
                  {o.idOrganizacao === activeOrgId && (
                    <Check size={14} className="org-switcher__check" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="org-switcher__divider" />

          {/* ─── Contexto: Todos / Favorito / Times / Grupos ─── */}
          <div className="org-switcher__section org-switcher__section--scroll">
            <p className="org-switcher__section-title">Time ou grupo</p>
            <input
              type="text"
              className="org-switcher__search"
              placeholder="Buscar time ou grupo…"
              value={ctxQuery}
              onChange={(e) => setCtxQuery(e.target.value)}
              aria-label="Buscar time ou grupo"
            />

            {/* Visão org-wide */}
            <button
              type="button"
              className={`org-switcher__team-item org-switcher__todos${isOrgWide ? ' is-active' : ''}`}
              onClick={() => applySelection({ kind: 'org' })}
              role="menuitemradio"
              aria-checked={isOrgWide}
            >
              <span
                className="org-switcher__avatar org-switcher__avatar--sm"
                style={{ background: colorFor(orgId) }}
              >
                {initials(orgName)}
              </span>
              <span className="org-switcher__team-name">{orgName} (Todos)</span>
              {isOrgWide && <Check size={14} className="org-switcher__check" />}
            </button>

            {/* Favorito */}
            {favoriteTeam && (
              <button
                type="button"
                className={`org-switcher__team-item is-fav${
                  selection.kind === 'team' && selection.id === favoriteTeam.id ? ' is-active' : ''
                }`}
                onClick={() => applySelection({ kind: 'team', id: favoriteTeam.id })}
                role="menuitemradio"
                aria-checked={selection.kind === 'team' && selection.id === favoriteTeam.id}
              >
                <TeamAvatar team={favoriteTeam} />
                <span className="org-switcher__team-name">{favoriteTeam.nome}</span>
                <button
                  type="button"
                  className="org-switcher__star is-fav"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(favoriteTeam.id);
                  }}
                  title="Remover favorito"
                  aria-label="Remover favorito"
                >
                  ★
                </button>
              </button>
            )}

            {/* Times (colapsável) */}
            <button
              type="button"
              className="org-switcher__group-head"
              onClick={() => setTimesOpen((v) => !v)}
              aria-expanded={timesOpen}
            >
              <span className="org-switcher__chevron">{timesOpen ? '▾' : '▸'}</span>
              <span>Times</span>
              <span className="org-switcher__count">{filteredTeams.length}</span>
            </button>
            {timesOpen &&
              (filteredTeams.length === 0 ? (
                <p className="org-switcher__empty">Nenhum time encontrado</p>
              ) : (
                filteredTeams.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`org-switcher__team-item${
                      selection.kind === 'team' && selection.id === t.id ? ' is-active' : ''
                    }`}
                    onClick={() => applySelection({ kind: 'team', id: t.id })}
                    role="menuitemradio"
                    aria-checked={selection.kind === 'team' && selection.id === t.id}
                  >
                    <TeamAvatar team={t} />
                    <span className="org-switcher__team-name">{t.nome}</span>
                    <button
                      type="button"
                      className={`org-switcher__star${t.favorito ? ' is-fav' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(t.id);
                      }}
                      title={t.favorito ? 'Remover favorito' : 'Marcar favorito'}
                      aria-label="Favoritar time"
                    >
                      ★
                    </button>
                  </button>
                ))
              ))}

            {/* Grupos (colapsável) */}
            {groups.length > 0 && (
              <>
                <button
                  type="button"
                  className="org-switcher__group-head"
                  onClick={() => setGruposOpen((v) => !v)}
                  aria-expanded={gruposOpen}
                >
                  <span className="org-switcher__chevron">{gruposOpen ? '▾' : '▸'}</span>
                  <span>Grupos</span>
                  <span className="org-switcher__count">{filteredGroups.length}</span>
                </button>
                {gruposOpen &&
                  (filteredGroups.length === 0 ? (
                    <p className="org-switcher__empty">Nenhum grupo encontrado</p>
                  ) : (
                    filteredGroups.map((g) => (
                      <button
                        key={g.idGrupo}
                        type="button"
                        className={`org-switcher__team-item${
                          selection.kind === 'group' && selection.id === g.idGrupo
                            ? ' is-active'
                            : ''
                        }`}
                        onClick={() => applySelection({ kind: 'group', id: g.idGrupo })}
                        role="menuitemradio"
                        aria-checked={selection.kind === 'group' && selection.id === g.idGrupo}
                      >
                        <span className="org-switcher__avatar org-switcher__avatar--sm org-switcher__avatar--group">
                          {initials(g.nome)}
                        </span>
                        <span className="org-switcher__team-name">{g.nome}</span>
                        {selection.kind === 'group' && selection.id === g.idGrupo && (
                          <Check size={14} className="org-switcher__check" />
                        )}
                      </button>
                    ))
                  ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

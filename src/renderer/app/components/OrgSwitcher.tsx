import { useEffect, useRef, useState } from 'react';
import { Check } from '../../components/common/Icons';

/**
 * Botão de organização atual (chip) + popover de troca de org / time / grupo.
 * Dados mockados — quando a API estiver pronta, substituir `MOCK_*` por hooks reais.
 */

interface MockOrg {
  id: string;
  name: string;
  initials: string;
  color: string;
  teams: Array<{ id: string; name: string; group: string; favorite?: boolean }>;
}

const MOCK_ORGS: MockOrg[] = [
  {
    id: 'beefor',
    name: 'Beefor',
    initials: 'BF',
    color: '#ffb060',
    teams: [
      { id: 'bee-dev', name: 'BeeTeam | Desenvolvimento', group: 'Engenharia', favorite: true },
      { id: 'bee-prod', name: 'BeeTeam | Produto', group: 'Produto' },
      { id: 'bee-mkt', name: 'BeeTeam | Marketing', group: 'Marketing' },
      { id: 'bee-rh', name: 'BeeTeam | RH', group: 'Pessoas' },
    ],
  },
  {
    id: 'acme',
    name: 'Acme Corp',
    initials: 'AC',
    color: '#7c83ff',
    teams: [
      { id: 'acme-eng', name: 'Engenharia Core', group: 'Tech' },
      { id: 'acme-ds', name: 'Design System', group: 'Tech' },
    ],
  },
  {
    id: 'pulse',
    name: 'Pulse Labs',
    initials: 'PL',
    color: '#42d6a4',
    teams: [
      { id: 'pulse-ai', name: 'AI Lab', group: 'Research' },
      { id: 'pulse-data', name: 'Data Platform', group: 'Plataforma' },
    ],
  },
];

export function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const [activeOrgId, setActiveOrgId] = useState(MOCK_ORGS[0].id);
  const [activeTeamId, setActiveTeamId] = useState(MOCK_ORGS[0].teams[0].id);
  const [favoriteTeamId, setFavoriteTeamId] = useState(
    MOCK_ORGS[0].teams.find((t) => t.favorite)?.id ?? null,
  );
  const [orgQuery, setOrgQuery] = useState('');
  const [teamQuery, setTeamQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // limpa buscas ao fechar
  useEffect(() => {
    if (!open) {
      setOrgQuery('');
      setTeamQuery('');
    }
  }, [open]);

  const activeOrg = MOCK_ORGS.find((o) => o.id === activeOrgId) ?? MOCK_ORGS[0];
  const activeTeam = activeOrg.teams.find((t) => t.id === activeTeamId) ?? activeOrg.teams[0];

  const filteredOrgs = MOCK_ORGS.filter((o) =>
    o.name.toLowerCase().includes(orgQuery.trim().toLowerCase()),
  );
  const filteredTeams = activeOrg.teams.filter((t) =>
    t.name.toLowerCase().includes(teamQuery.trim().toLowerCase()),
  );

  const handleSwitchOrg = (id: string) => {
    setActiveOrgId(id);
    setTeamQuery('');
    const first = MOCK_ORGS.find((o) => o.id === id)?.teams[0];
    if (first) setActiveTeamId(first.id);
  };

  return (
    <div className="org-switcher" ref={ref}>
      <button
        type="button"
        className={`org-switcher__chip${open ? ' is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Trocar organização ou time"
        data-sound="click"
      >
        <span className="org-switcher__avatar" style={{ background: activeOrg.color }}>
          {activeOrg.initials}
        </span>
        <span className="org-switcher__labels">
          <strong className="org-switcher__org">{activeOrg.name}</strong>
          <span className="org-switcher__team">{activeTeam.name}</span>
        </span>
        <span className="org-switcher__caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="org-switcher__panel" role="menu">
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
                  key={o.id}
                  type="button"
                  className={`org-switcher__org-item${o.id === activeOrgId ? ' is-active' : ''}`}
                  onClick={() => handleSwitchOrg(o.id)}
                  role="menuitemradio"
                  aria-checked={o.id === activeOrgId}
                >
                  <span
                    className="org-switcher__avatar org-switcher__avatar--sm"
                    style={{ background: o.color }}
                  >
                    {o.initials}
                  </span>
                  <span>{o.name}</span>
                  {o.id === activeOrgId && <Check size={14} className="org-switcher__check" />}
                </button>
              ))}
            </div>
          </div>

          <div className="org-switcher__divider" />

          {favoriteTeamId && (
            <div className="org-switcher__section">
              <p className="org-switcher__section-title">⭐ Time favorito</p>
              {(() => {
                const fav = activeOrg.teams.find((t) => t.id === favoriteTeamId);
                if (!fav) return null;
                return (
                  <button
                    type="button"
                    className={`org-switcher__team-item is-fav${fav.id === activeTeamId ? ' is-active' : ''}`}
                    onClick={() => setActiveTeamId(fav.id)}
                    role="menuitemradio"
                    aria-checked={fav.id === activeTeamId}
                  >
                    <span className="org-switcher__team-name">{fav.name}</span>
                    {fav.id === activeTeamId && <Check size={14} className="org-switcher__check" />}
                  </button>
                );
              })()}
            </div>
          )}

          <div className="org-switcher__section org-switcher__section--scroll">
            <p className="org-switcher__section-title">Times</p>
            <input
              type="text"
              className="org-switcher__search"
              placeholder="Buscar time…"
              value={teamQuery}
              onChange={(e) => setTeamQuery(e.target.value)}
              aria-label="Buscar time"
            />
            {filteredTeams.length === 0 && (
              <p className="org-switcher__empty">Nenhum time encontrado</p>
            )}
            {filteredTeams.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`org-switcher__team-item${t.id === activeTeamId ? ' is-active' : ''}`}
                onClick={() => setActiveTeamId(t.id)}
                role="menuitemradio"
                aria-checked={t.id === activeTeamId}
              >
                <span className="org-switcher__team-name">{t.name}</span>
                <button
                  type="button"
                  className={`org-switcher__star${t.id === favoriteTeamId ? ' is-fav' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFavoriteTeamId(t.id === favoriteTeamId ? null : t.id);
                  }}
                  title={t.id === favoriteTeamId ? 'Remover favorito' : 'Marcar favorito'}
                  aria-label="Favoritar time"
                >
                  ★
                </button>
              </button>
            ))}
          </div>

          <p className="org-switcher__hint">Dados mockados — em breve sincronizado com Beefor.</p>
        </div>
      )}
    </div>
  );
}

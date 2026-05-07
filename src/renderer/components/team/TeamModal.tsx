import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TeamMember } from '../../../shared/types';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { birthdayKey, type BirthdayEntry } from '../../utils/teamCache';
import { isBirthdayToday } from '../../utils/dateUtils';
import { FunnyLoader } from '../FunnyLoader';
import { Refresh, Search } from '../Icons';
import { TeamMemberCard } from './TeamMemberCard';
import { TeamMemberDetailsDrawer } from './TeamMemberDetailsDrawer';

interface Props {
  open: boolean;
  onClose: () => void;
}

type StatusFilter = 'all' | 'active' | 'inactive';

function matches(member: TeamMember, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    member.nome.toLowerCase().includes(needle) ||
    member.email.toLowerCase().includes(needle) ||
    member.funcaoPrincipal.toLowerCase().includes(needle)
  );
}

function formatLastUpdate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function TeamModal({ open, onClose }: Props) {
  const {
    members,
    birthdays,
    loading,
    refreshing,
    error,
    lastUpdated,
    fromCache,
    refresh,
    setBirthdays,
  } = useTeamMembers(open);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setStatusFilter('all');
      setSelectedKey(null);
    }
  }, [open]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (statusFilter === 'active' && !m.status) return false;
      if (statusFilter === 'inactive' && m.status) return false;
      return matches(m, query);
    });
  }, [members, query, statusFilter]);

  const partyCount = useMemo(
    () => members.filter((m) => isBirthdayToday(birthdays[birthdayKey(m)]?.birthday)).length,
    [members, birthdays],
  );

  const selected = useMemo(() => {
    if (!selectedKey) return null;
    return members.find((m) => birthdayKey(m) === selectedKey) ?? null;
  }, [selectedKey, members]);

  if (!open) return null;

  const handleBirthdayChange = (member: TeamMember, next: BirthdayEntry | null) => {
    const key = birthdayKey(member);
    const copy = { ...birthdays };
    if (next) copy[key] = next;
    else delete copy[key];
    setBirthdays(copy);
  };

  const showInitialLoader = loading && members.length === 0;

  return createPortal(
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="team-modal-title"
        aria-modal="true"
        className="modal-card team-modal"
        role="dialog"
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">Equipe</p>
            <h2 id="team-modal-title">Quem é meu timão?</h2>
            <p className="team-modal__subtitle">
              {fromCache && !refreshing && 'Mostrando time salvo · '}
              {refreshing && 'Atualizando time… · '}
              {members.length > 0
                ? `${members.length} ${members.length === 1 ? 'pessoa' : 'pessoas'}`
                : 'Sem dados'}
              {partyCount > 0 && ` · 🎂 ${partyCount} aniversário${partyCount > 1 ? 's' : ''} hoje`}
              {lastUpdated && !refreshing && ` · atualizado ${formatLastUpdate(lastUpdated)}`}
            </p>
          </div>
          <div className="team-modal__head-actions">
            <button
              type="button"
              className="secondary compact"
              onClick={() => void refresh()}
              disabled={loading || refreshing}
              data-sound="team-refresh"
            >
              <Refresh size={14} />
              Atualizar
            </button>
            <button
              type="button"
              className="secondary compact"
              onClick={onClose}
              data-sound="close"
            >
              Fechar
            </button>
          </div>
        </div>

        <div className="team-modal__toolbar">
          <label className="team-modal__search">
            <Search size={14} />
            <input
              type="search"
              placeholder="Buscar por nome, função ou e-mail"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="team-modal__filters" role="tablist">
            {([
              ['all', 'Todos'],
              ['active', 'Ativos'],
              ['inactive', 'Inativos'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={statusFilter === value}
                className={statusFilter === value ? 'active' : ''}
                onClick={() => setStatusFilter(value)}
                data-sound="tab-home"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={`team-modal__body ${selected ? 'team-modal__body--with-drawer' : ''}`}>
          <div className="team-modal__main">
            {showInitialLoader ? (
              <div className="team-modal__loader">
                <FunnyLoader title="Reunindo o time" />
              </div>
            ) : error && members.length === 0 ? (
              <div className="team-modal__error">
                <strong>Não consegui buscar o time agora.</strong>
                <span>{error}</span>
                <button
                  type="button"
                  className="compact"
                  onClick={() => void refresh()}
                  data-sound="generic-click"
                >
                  Tentar novamente
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="team-modal__empty">
                {members.length === 0 ? 'Sem pessoas no retorno.' : 'Nada encontrado pra esse filtro.'}
              </div>
            ) : (
              <>
                {error && (
                  <div className="team-modal__warn">
                    Falha ao atualizar — exibindo último cache. <span>({error})</span>
                  </div>
                )}
                <ul className="team-grid">
                  {filtered.map((m) => {
                    const key = birthdayKey(m);
                    return (
                      <li key={key}>
                        <TeamMemberCard
                          member={m}
                          birthday={birthdays[key]}
                          selected={selectedKey === key}
                          onSelect={() => setSelectedKey(key)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

          {selected && (
            <TeamMemberDetailsDrawer
              member={selected}
              birthday={birthdays[birthdayKey(selected)]}
              onClose={() => setSelectedKey(null)}
              onBirthdayChange={(next) => handleBirthdayChange(selected, next)}
            />
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}

import type { TeamMember } from '../../../../shared/types';
import type { BirthdayEntry } from '../../../utils/teamCache';
import { Briefcase, Mail, X } from '../../../components/common/Icons';
import { formatDateTimePtBr } from '../../../utils/dateUtils';
import { TeamAvatar } from './TeamAvatar';
import { TeamStatusBadge } from './TeamStatusBadge';
import { TeamBirthdayEditor } from './TeamBirthdayEditor';

interface Props {
  member: TeamMember;
  birthday?: BirthdayEntry;
  onClose: () => void;
  onBirthdayChange: (next: BirthdayEntry | null) => void;
}

export function TeamMemberDetailsDrawer({
  member,
  birthday,
  onClose,
  onBirthdayChange,
}: Props) {
  return (
    <aside className="team-drawer" role="dialog" aria-label={`Detalhes de ${member.nome}`}>
      <header className="team-drawer__head">
        <h3>Perfil</h3>
        <button
          type="button"
          className="icon-btn"
          aria-label="Fechar painel"
          onClick={onClose}
          data-sound="close"
        >
          <X size={16} />
        </button>
      </header>

      <div className="team-drawer__hero">
        <TeamAvatar name={member.nome} src={member.foto} size={92} />
        <div>
          <strong className="team-drawer__name">{member.nome || '—'}</strong>
          <span className="team-drawer__role">
            <Briefcase size={12} /> {member.funcaoPrincipal || '—'}
          </span>
          <span className="team-drawer__email">
            <Mail size={12} /> {member.email || '—'}
          </span>
          <TeamStatusBadge active={member.status} size="md" />
        </div>
      </div>

      <section className="team-drawer__section">
        <h4>Atividade recente</h4>
        <dl className="team-drawer__dl">
          <div>
            <dt>Último cliente</dt>
            <dd>{member.ultimoCliente || '—'}</dd>
          </div>
          <div>
            <dt>Último checkpoint</dt>
            <dd>{formatDateTimePtBr(member.ultimoCheckpoint)}</dd>
          </div>
        </dl>
      </section>

      <section className="team-drawer__section">
        <h4>Último checklist</h4>
        {member.respostasUltimoChecklist.length === 0 ? (
          <p className="team-drawer__empty">Sem respostas registradas.</p>
        ) : (
          <ul className="team-drawer__checklist">
            {member.respostasUltimoChecklist.map((q, i) => (
              <li key={`${q.titulo}-${i}`}>
                <span className="team-drawer__q">{q.titulo}</span>
                <span className="team-drawer__a">{q.resposta || '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="team-drawer__section">
        <TeamBirthdayEditor value={birthday} onSave={onBirthdayChange} />
      </section>
    </aside>
  );
}

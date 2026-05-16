import { memo } from 'react';
import type { TeamMember } from '@shared/types/index';
import type { BirthdayEntry } from '../../../utils/teamCache';
import { Cake, Mail } from '../../../components/common/Icons';
import { formatBirthdayPretty, isBirthdayToday } from '../../../utils/dates';
import { TeamAvatar } from './TeamAvatar';
import { TeamStatusBadge } from './TeamStatusBadge';

interface Props {
  member: TeamMember;
  birthday?: BirthdayEntry;
  selected: boolean;
  memberKey: string;
  onSelect: (key: string) => void;
}

export const TeamMemberCard = memo(function TeamMemberCard({
  member,
  birthday,
  selected,
  memberKey,
  onSelect,
}: Props) {
  const partyToday = isBirthdayToday(birthday?.birthday);
  const niceBirthday = formatBirthdayPretty(birthday?.birthday);

  return (
    <button
      type="button"
      className={`team-card ${selected ? 'team-card--active' : ''} ${partyToday ? 'team-card--party' : ''}`}
      onClick={() => onSelect(memberKey)}
      data-sound="card-pick"
    >
      {partyToday && (
        <span className="team-card__party-tag" title="Aniversariante de hoje">
          <Cake size={14} /> Aniversário hoje!
        </span>
      )}
      <TeamAvatar name={member.nome} src={member.foto} size={64} />
      <div className="team-card__info">
        <strong className="team-card__name">{member.nome || '—'}</strong>
        <span className="team-card__role">{member.funcaoPrincipal || '—'}</span>
        <span className="team-card__email">
          <Mail size={12} />
          <span>{member.email || '—'}</span>
        </span>
        <div className="team-card__bottom">
          <TeamStatusBadge active={member.status} />
          {birthday?.birthday && (
            <span className="team-card__bday" title="Aniversário cadastrado">
              <Cake size={12} /> {niceBirthday}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

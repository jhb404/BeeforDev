import { useEffect, useState } from 'react';
import type { BirthdayEntry } from '../../../utils/teamCache';
import { Cake, Check, Edit3, X } from '../../../components/common/Icons';
import { formatBirthdayPretty } from '../../../utils/dateUtils';

interface Props {
  value?: BirthdayEntry;
  onSave: (next: BirthdayEntry | null) => void;
}

export function TeamBirthdayEditor({ value, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.birthday ?? '');
  const [nickname, setNickname] = useState(value?.nickname ?? '');
  const [notes, setNotes] = useState(value?.notes ?? '');

  useEffect(() => {
    setDraft(value?.birthday ?? '');
    setNickname(value?.nickname ?? '');
    setNotes(value?.notes ?? '');
    setEditing(false);
  }, [value]);

  const cancel = () => {
    setDraft(value?.birthday ?? '');
    setNickname(value?.nickname ?? '');
    setNotes(value?.notes ?? '');
    setEditing(false);
  };

  const save = () => {
    const trimmed = draft.trim();
    if (!trimmed && !nickname.trim() && !notes.trim()) {
      onSave(null);
      setEditing(false);
      return;
    }
    onSave({
      birthday: trimmed || undefined,
      nickname: nickname.trim() || undefined,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    setEditing(false);
  };

  const clear = () => {
    onSave(null);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="team-bday-card">
        <div className="team-bday-card__head">
          <span className="team-bday-card__title">
            <Cake size={14} /> Aniversário
          </span>
          <button
            type="button"
            className="secondary compact team-bday-card__edit"
            onClick={() => setEditing(true)}
            data-sound="click"
          >
            <Edit3 size={12} />
            {value?.birthday ? 'Editar' : 'Adicionar'}
          </button>
        </div>
        <div className="team-bday-card__body">
          <strong>{formatBirthdayPretty(value?.birthday)}</strong>
          {value?.nickname && (
            <span className="team-bday-card__nick">"{value.nickname}"</span>
          )}
          {value?.notes && (
            <p className="team-bday-card__notes">{value.notes}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="team-bday-card team-bday-card--editing">
      <div className="team-bday-card__head">
        <span className="team-bday-card__title">
          <Cake size={14} /> Editar aniversário
        </span>
      </div>
      <label className="team-bday-card__field">
        <span>Data</span>
        <input
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </label>
      <label className="team-bday-card__field">
        <span>Apelido</span>
        <input
          type="text"
          maxLength={40}
          placeholder="Ex.: Jojo"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </label>
      <label className="team-bday-card__field">
        <span>Notas</span>
        <textarea
          rows={2}
          maxLength={200}
          placeholder="Sabor de bolo favorito, alergia, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <div className="team-bday-card__actions">
        {value?.birthday && (
          <button
            type="button"
            className="secondary compact team-bday-card__clear"
            onClick={clear}
            data-sound="generic-click"
          >
            <X size={12} /> Remover
          </button>
        )}
        <button
          type="button"
          className="secondary compact"
          onClick={cancel}
          data-sound="close"
        >
          Cancelar
        </button>
        <button
          type="button"
          className="compact"
          onClick={save}
          data-sound="click"
        >
          <Check size={12} /> Salvar
        </button>
      </div>
    </div>
  );
}

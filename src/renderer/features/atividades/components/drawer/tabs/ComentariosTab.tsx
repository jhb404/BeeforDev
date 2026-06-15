import { useState } from 'react';
import { MessageCircle } from '../../../../../components/common/Icons';
import type { UseCardInteracoesResult } from '../../../hooks/useCardInteracoes';
import { formatDate } from '../../../utils/atividadeDisplay';
import { EmptyState } from '../parts/EmptyState';

export function ComentariosTab({ interacoes }: { interacoes: UseCardInteracoesResult }) {
  const [novoComentario, setNovoComentario] = useState('');

  const enviar = async () => {
    const ok = await interacoes.adicionarComentario(novoComentario);
    if (ok) setNovoComentario('');
  };

  return (
    <div className="ativ-drawer__section ativ-drawer__tab-content">
      <div className="ativ-drawer__comment-add">
        <textarea
          className="ativ-drawer__textarea"
          value={novoComentario}
          onChange={(e) => setNovoComentario(e.target.value)}
          placeholder="Escrever um comentário…"
          rows={3}
        />
        <button
          type="button"
          className="primary compact"
          onClick={enviar}
          disabled={interacoes.enviandoComentario || !novoComentario.trim()}
          data-sound="confirm"
        >
          {interacoes.enviandoComentario ? 'Enviando…' : 'Comentar'}
        </button>
      </div>

      {interacoes.comentarios.length > 0 ? (
        <div className="ativ-drawer__comments">
          {interacoes.comentarios.map((c, i) => (
            <div key={i} className="ativ-drawer__comment">
              <div className="ativ-drawer__comment-header">
                <strong data-inicial={(c.autor || '?').charAt(0)}>{c.autor}</strong>
                <span>{c.data ? formatDate(c.data) : ''}</span>
              </div>
              <p>{c.texto}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<MessageCircle size={24} />} text="Nenhum comentário ainda." />
      )}
    </div>
  );
}

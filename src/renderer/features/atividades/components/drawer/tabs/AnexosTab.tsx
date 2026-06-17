import type { ChangeEvent } from 'react';
import { Paperclip } from '../../../../../components/common/Icons';
import type { UseCardInteracoesResult } from '../../../hooks/useCardInteracoes';
import { EmptyState } from '../parts/EmptyState';

export function AnexosTab({ interacoes }: { interacoes: UseCardInteracoesResult }) {
  const handleAnexar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await interacoes.adicionarAnexo(file);
    e.target.value = '';
  };

  return (
    <div className="ativ-drawer__section ativ-drawer__tab-content">
      <label className="ativ-drawer__upload secondary compact">
        {interacoes.enviandoAnexo ? 'Enviando…' : '+ Adicionar anexo'}
        <input type="file" hidden onChange={handleAnexar} disabled={interacoes.enviandoAnexo} />
      </label>

      {interacoes.anexos.length > 0 ? (
        <div className="ativ-drawer__attachments">
          {interacoes.anexos.map((f) => (
            <div key={f.idAnexo} className="ativ-drawer__attachment">
              <span>
                <Paperclip size={14} />
              </span>
              {f.url ? (
                <a href={f.url} target="_blank" rel="noreferrer">
                  {f.nome}
                </a>
              ) : (
                <span>{f.nome}</span>
              )}
              <button
                type="button"
                className="ativ-drawer__attachment-del"
                title="Remover anexo"
                onClick={() => interacoes.removerAnexo(f.idAnexo)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        !interacoes.loadingAnexos && (
          <EmptyState icon={<Paperclip size={24} />} text="Nenhum anexo encontrado." />
        )
      )}
    </div>
  );
}

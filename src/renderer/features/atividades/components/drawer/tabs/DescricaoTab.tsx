import type { UseAtividadeEdicaoResult } from '../../../hooks/useAtividadeEdicao';

export function DescricaoTab({ edicao }: { edicao: UseAtividadeEdicaoResult }) {
  return (
    <div className="ativ-drawer__section ativ-drawer__tab-content">
      <textarea
        className="ativ-drawer__textarea"
        value={edicao.form.descricao}
        onChange={(e) => edicao.setCampo('descricao', e.target.value)}
        placeholder="Descrição do card…"
        rows={10}
      />
    </div>
  );
}

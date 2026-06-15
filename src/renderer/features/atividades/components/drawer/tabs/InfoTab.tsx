import type { BeeforAtividade } from '@shared/types/index';
import type { AtividadeDetalhes } from '../../../hooks/useAtividadeDetalhes';
import type { UseAtividadeEdicaoResult } from '../../../hooks/useAtividadeEdicao';
import { PONTOS_FIBONACCI } from '../../../hooks/useAtividadeEdicao';
import { formatDateLong } from '../../../utils/atividadeDisplay';
import { DrawerField, EditRow } from '../parts/DrawerField';
import { EsforcoInput } from '../parts/EsforcoInput';

interface Props {
  atividade: BeeforAtividade;
  info: AtividadeDetalhes;
  edicao: UseAtividadeEdicaoResult;
}

export function InfoTab({ atividade: a, info, edicao }: Props) {
  const { form, setCampo } = edicao;
  return (
    <div className="ativ-drawer__section">
      <div className="ativ-drawer__fields">
        <EditRow label="Responsável">
          <select
            className="ativ-drawer__input"
            value={form.idResponsavel ?? ''}
            onChange={(e) => setCampo('idResponsavel', e.target.value || null)}
            disabled={edicao.loadingListas}
          >
            <option value="">—</option>
            {edicao.responsaveis.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
        </EditRow>

        <EditRow label="Projeto">
          <select
            className="ativ-drawer__input"
            value={form.idProjeto ?? ''}
            onChange={(e) => setCampo('idProjeto', e.target.value || null)}
            disabled={edicao.loadingListas}
          >
            <option value="">Sem projeto</option>
            {edicao.projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </EditRow>

        <DrawerField label="Épico" value={info.epico} placeholder="—" />
        <DrawerField label="História" value={info.historia} placeholder="—" />

        <EditRow label="Sprint / Iteração">
          <select
            className="ativ-drawer__input"
            value={form.idIteracao ?? ''}
            onChange={(e) => setCampo('idIteracao', e.target.value || null)}
            disabled={edicao.loadingListas}
          >
            <option value="">—</option>
            {edicao.iteracoes.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </select>
        </EditRow>

        <EditRow label="Esforço">
          <EsforcoInput value={form.esforco} onChange={(v) => setCampo('esforco', v)} />
        </EditRow>

        <EditRow label="Pontos (Fibonacci)">
          <select
            className="ativ-drawer__input"
            value={form.pontos ?? ''}
            onChange={(e) =>
              setCampo('pontos', e.target.value === '' ? null : Number(e.target.value))
            }
          >
            <option value="">—</option>
            {PONTOS_FIBONACCI.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </EditRow>

        <EditRow label="Data de início">
          <input
            className="ativ-drawer__input"
            type="date"
            value={form.dataInicio ?? ''}
            onChange={(e) => setCampo('dataInicio', e.target.value || null)}
          />
        </EditRow>

        <DrawerField label="Data de entrega" value={info.dataEntrega} placeholder="—/—/—" />

        <EditRow label="Prev. entrega">
          <input
            className="ativ-drawer__input"
            type="date"
            value={form.dataPrevistaEntrega ?? ''}
            onChange={(e) => setCampo('dataPrevistaEntrega', e.target.value || null)}
          />
        </EditRow>

        <DrawerField label="Criado em" value={formatDateLong(a.dataCriacao)} />
      </div>
    </div>
  );
}

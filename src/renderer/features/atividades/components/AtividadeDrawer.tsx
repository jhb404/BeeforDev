import { useState } from 'react';
import type { BeeforAtividade } from '@shared/types/index';
import { useAtividadeDetalhes } from '../hooks/useAtividadeDetalhes';
import { useAtividadeEdicao, TIPOS_CARD } from '../hooks/useAtividadeEdicao';
import { useCardInteracoes } from '../hooks/useCardInteracoes';
import { AlertTriangle } from '../../../components/common/Icons';
import { getMomentoClass } from '../utils/atividadeDisplay';
import { InfoTab } from './drawer/tabs/InfoTab';
import { DescricaoTab } from './drawer/tabs/DescricaoTab';
import { ComentariosTab } from './drawer/tabs/ComentariosTab';
import { AnexosTab } from './drawer/tabs/AnexosTab';
import { HistoricoTab } from './drawer/tabs/HistoricoTab';

type DrawerTab = 'info' | 'descricao' | 'comentarios' | 'historico' | 'anexos';

const TAB_LABELS: Record<DrawerTab, string> = {
  info: 'Informações',
  descricao: 'Descrição',
  comentarios: 'Comentários',
  anexos: 'Anexos',
  historico: 'Histórico',
};

const TAB_ORDER: DrawerTab[] = ['info', 'descricao', 'comentarios', 'anexos', 'historico'];

interface DrawerProps {
  atividade: BeeforAtividade;
  onClose: () => void;
  /** Chamado apos salvar/arquivar com sucesso (p/ recarregar lista). */
  onChanged?: () => void;
}

export function AtividadeDrawer({ atividade: a, onClose, onChanged }: DrawerProps) {
  const { detalhes: info, loading, error, rawCard } = useAtividadeDetalhes(a);
  const edicao = useAtividadeEdicao(a, info, loading, rawCard);
  const { form, setCampo } = edicao;
  const interacoes = useCardInteracoes(a, info.comentarios);
  const [tab, setTab] = useState<DrawerTab>('info');

  const handleSalvar = async () => {
    const ok = await edicao.salvar();
    if (ok) {
      onChanged?.();
      onClose();
    }
  };

  const handleArquivar = async () => {
    const ok = await edicao.arquivar();
    if (ok) {
      onChanged?.();
      onClose();
    }
  };

  return (
    <div className="ativ-drawer" role="region" aria-label="Detalhes da atividade">
      <div className="ativ-drawer__head">
        <div className="ativ-drawer__badges">
          <span className="atividade-card__numero">{a.numeroCard}</span>

          <select
            className={`ativ-drawer__select-native ${getMomentoClass(a.momento)}`}
            value={form.idColuna ?? ''}
            onChange={(e) => setCampo('idColuna', e.target.value || null)}
            disabled={edicao.loadingListas || edicao.colunas.length === 0}
            aria-label="Status"
          >
            {edicao.colunas.length === 0 && <option value="">{a.momento || 'Status'}</option>}
            {edicao.colunas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          <select
            className="ativ-drawer__select-native"
            value={form.tipo ?? ''}
            onChange={(e) =>
              setCampo('tipo', e.target.value === '' ? null : Number(e.target.value))
            }
            aria-label="Tipo"
          >
            {TIPOS_CARD.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="ativ-drawer__head-actions">
          <button
            type="button"
            className="ativ-drawer__archive secondary compact"
            title="Arquivar atividade"
            aria-label="Arquivar"
            data-sound="close"
            disabled={edicao.arquivando}
            onClick={handleArquivar}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
            Arquivar
          </button>
          <button
            type="button"
            className="ativ-drawer__close secondary compact"
            onClick={onClose}
            aria-label="Fechar detalhes"
            data-sound="close"
          >
            ×
          </button>
        </div>
      </div>

      <input
        className="ativ-drawer__title-input"
        value={form.nome}
        onChange={(e) => setCampo('nome', e.target.value)}
        placeholder="Título do card"
        aria-label="Título"
      />

      <p className="ativ-drawer__board">
        <span className="ativ-drawer__field-label">Board</span>
        {a.timeBoard}
      </p>

      <div className="ativ-drawer__blocked-row">
        <div className="ativ-drawer__field">
          <span className="ativ-drawer__field-label">Bloqueado</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={form.bloqueado}
              onChange={(e) => setCampo('bloqueado', e.target.checked)}
              aria-label="Bloqueado"
            />
            <span className="switch__track" />
            <span className="switch__thumb" />
          </label>
        </div>
        {form.bloqueado && (
          <div className="ativ-drawer__blocked-reason">
            <span className="ativ-drawer__field-label">Motivo *</span>
            <input
              className="ativ-drawer__input"
              type="text"
              value={form.motivoBloqueio ?? ''}
              onChange={(e) => setCampo('motivoBloqueio', e.target.value || null)}
              placeholder="Motivo do bloqueio"
            />
          </div>
        )}
      </div>

      {info.etiquetas.length > 0 && (
        <div className="ativ-drawer__tags-row">
          {info.etiquetas.map((tag) => (
            <span key={tag} className="ativ-drawer__tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="ativ-drawer__divider" />

      {loading && <p className="ativ-drawer__coming-soon">Carregando detalhes do card…</p>}
      {error && !loading && (
        <p className="ativ-drawer__coming-soon">
          <AlertTriangle size={14} /> {error}
        </p>
      )}

      <div className="ativ-drawer__tabs" role="tablist">
        {TAB_ORDER.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`ativ-drawer__tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
            data-sound="tab-home"
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'info' && <InfoTab atividade={a} info={info} edicao={edicao} />}
      {tab === 'descricao' && <DescricaoTab edicao={edicao} />}
      {tab === 'comentarios' && <ComentariosTab interacoes={interacoes} />}
      {tab === 'anexos' && <AnexosTab interacoes={interacoes} />}
      {tab === 'historico' && <HistoricoTab interacoes={interacoes} />}

      {(edicao.erro || interacoes.erro) && (
        <p className="ativ-drawer__coming-soon">
          <AlertTriangle size={14} /> {edicao.erro || interacoes.erro}
        </p>
      )}

      <div className="ativ-drawer__footer">
        <button type="button" className="secondary compact" onClick={onClose} data-sound="close">
          Cancelar
        </button>
        <button
          type="button"
          className="primary compact"
          onClick={handleSalvar}
          disabled={edicao.salvando || loading}
          data-sound="confirm"
        >
          {edicao.salvando ? 'Salvando…' : 'Confirmar'}
        </button>
      </div>
    </div>
  );
}

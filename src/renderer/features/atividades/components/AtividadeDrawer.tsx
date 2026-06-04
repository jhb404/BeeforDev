import { useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import type { BeeforAtividade } from '@shared/types/index';
import { useAtividadeDetalhes } from '../hooks/useAtividadeDetalhes';
import { useAtividadeEdicao, PONTOS_FIBONACCI, TIPOS_CARD } from '../hooks/useAtividadeEdicao';
import { useCardInteracoes } from '../hooks/useCardInteracoes';
import {
  formatDate,
  formatDateLong,
  getMomentoClass,
} from '../utils/atividadeDisplay';

type DrawerTab = 'info' | 'descricao' | 'comentarios' | 'historico' | 'anexos';

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
  const [novoComentario, setNovoComentario] = useState('');

  const handleEnviarComentario = async () => {
    const okc = await interacoes.adicionarComentario(novoComentario);
    if (okc) setNovoComentario('');
  };

  const handleAnexar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await interacoes.adicionarAnexo(file);
    e.target.value = '';
  };

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

          {/* Status (coluna) editavel */}
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

          {/* Tipo editavel */}
          <select
            className="ativ-drawer__select-native"
            value={form.tipo ?? ''}
            onChange={(e) => setCampo('tipo', e.target.value === '' ? null : Number(e.target.value))}
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

      {loading && (
        <p className="ativ-drawer__coming-soon">Carregando detalhes do card…</p>
      )}
      {error && !loading && (
        <p className="ativ-drawer__coming-soon">⚠️ {error}</p>
      )}

      <div className="ativ-drawer__tabs" role="tablist">
        {(['info', 'descricao', 'comentarios', 'anexos', 'historico'] as DrawerTab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`ativ-drawer__tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
            data-sound="tab-home"
          >
            {t === 'info' && 'Informações'}
            {t === 'descricao' && 'Descrição'}
            {t === 'comentarios' && 'Comentários'}
            {t === 'historico' && 'Histórico'}
            {t === 'anexos' && 'Anexos'}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="ativ-drawer__section">
          <div className="ativ-drawer__fields">
            {/* Responsável (select) */}
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

            {/* Projeto (select) */}
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

            {/* Sprint / Iteração (select) */}
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

            {/* Esforço (h:m) */}
            <EditRow label="Esforço">
              <EsforcoInput
                value={form.esforco}
                onChange={(v) => setCampo('esforco', v)}
              />
            </EditRow>

            {/* Pontos (Fibonacci) */}
            <EditRow label="Pontos (Fibonacci)">
              <select
                className="ativ-drawer__input"
                value={form.pontos ?? ''}
                onChange={(e) => setCampo('pontos', e.target.value === '' ? null : Number(e.target.value))}
              >
                <option value="">—</option>
                {PONTOS_FIBONACCI.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </EditRow>

            {/* Data de início */}
            <EditRow label="Data de início">
              <input
                className="ativ-drawer__input"
                type="date"
                value={form.dataInicio ?? ''}
                onChange={(e) => setCampo('dataInicio', e.target.value || null)}
              />
            </EditRow>

            {/* Data de entrega (somente leitura — definida ao concluir) */}
            <DrawerField label="Data de entrega" value={info.dataEntrega} placeholder="—/—/—" />

            {/* Prev. entrega */}
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
      )}

      {tab === 'descricao' && (
        <div className="ativ-drawer__section ativ-drawer__tab-content">
          <textarea
            className="ativ-drawer__textarea"
            value={form.descricao}
            onChange={(e) => setCampo('descricao', e.target.value)}
            placeholder="Descrição do card…"
            rows={10}
          />
        </div>
      )}

      {tab === 'comentarios' && (
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
              onClick={handleEnviarComentario}
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
            <EmptyState icon="💬" text="Nenhum comentário ainda." />
          )}
        </div>
      )}

      {tab === 'anexos' && (
        <div className="ativ-drawer__section ativ-drawer__tab-content">
          <label className="ativ-drawer__upload secondary compact">
            {interacoes.enviandoAnexo ? 'Enviando…' : '+ Adicionar anexo'}
            <input
              type="file"
              hidden
              onChange={handleAnexar}
              disabled={interacoes.enviandoAnexo}
            />
          </label>

          {interacoes.anexos.length > 0 ? (
            <div className="ativ-drawer__attachments">
              {interacoes.anexos.map((f) => (
                <div key={f.idAnexo} className="ativ-drawer__attachment">
                  <span>📎</span>
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
            !interacoes.loadingAnexos && <EmptyState icon="📎" text="Nenhum anexo encontrado." />
          )}
        </div>
      )}

      {tab === 'historico' && (
        <div className="ativ-drawer__section ativ-drawer__tab-content">
          {interacoes.logs.length > 0 ? (
            <div className="ativ-drawer__history">
              {interacoes.logs.map((h, i) => (
                <div key={i} className="ativ-drawer__history-item">
                  <span className="ativ-drawer__history-dot" />
                  <div>
                    <span className="ativ-drawer__history-action">{h.acao}</span>
                    <span className="ativ-drawer__history-meta">
                      {h.usuario}
                      {h.usuario && h.data ? ' · ' : ''}
                      {h.data ? formatDate(h.data) : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !interacoes.loadingLogs && <EmptyState icon="📋" text="Nenhuma atividade registrada." />
          )}
        </div>
      )}

      {(edicao.erro || interacoes.erro) && (
        <p className="ativ-drawer__coming-soon">⚠️ {edicao.erro || interacoes.erro}</p>
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

function EditRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ativ-drawer__field">
      <span className="ativ-drawer__field-label">{label}</span>
      {children}
    </div>
  );
}

/** Input de esforço no formato h:m, serializado como "H:MM". */
function EsforcoInput({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [h, m] = (value ?? '').split(':');
  const horas = h ?? '';
  const minutos = m ?? '';

  const emit = (nh: string, nm: string) => {
    const hh = nh.trim();
    const mm = nm.trim();
    if (!hh && !mm) {
      onChange(null);
      return;
    }
    onChange(`${hh || '0'}:${(mm || '0').padStart(2, '0')}`);
  };

  return (
    <span className="ativ-drawer__esforco">
      <input
        className="ativ-drawer__input ativ-drawer__input--xs"
        type="number"
        min={0}
        max={999}
        placeholder="h"
        value={horas}
        onChange={(e) => emit(e.target.value, minutos)}
      />
      <span>:</span>
      <input
        className="ativ-drawer__input ativ-drawer__input--xs"
        type="number"
        min={0}
        max={59}
        placeholder="m"
        value={minutos}
        onChange={(e) => emit(horas, e.target.value)}
      />
    </span>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="ativ-drawer__empty-state">
      <span>{icon}</span>
      <p>{text}</p>
    </div>
  );
}

function DrawerField({
  label,
  value,
  placeholder,
}: {
  label: string;
  value: string | null | undefined;
  placeholder?: string;
}) {
  return (
    <div className="ativ-drawer__field">
      <span className="ativ-drawer__field-label">{label}</span>
      <span
        className={`ativ-drawer__field-value ${!value ? 'ativ-drawer__field-value--empty' : ''}`}
      >
        {value ?? placeholder ?? '—'}
      </span>
    </div>
  );
}

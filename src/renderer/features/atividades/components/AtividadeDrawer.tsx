import { useState } from 'react';
import type { BeeforAtividade } from '@shared/types/index';
import { useAtividadeDetalhes } from '../hooks/useAtividadeDetalhes';
import {
  TIPO_ICON,
  TIPO_LABEL,
  fibLabel,
  formatDate,
  formatDateLong,
  formatEsforco,
  getMomentoClass,
} from '../utils/atividadeDisplay';

type DrawerTab = 'info' | 'descricao' | 'comentarios' | 'historico' | 'anexos';

interface DrawerProps {
  atividade: BeeforAtividade;
  onClose: () => void;
}

export function AtividadeDrawer({ atividade: a, onClose }: DrawerProps) {
  const { detalhes: info, loading, error } = useAtividadeDetalhes(a);
  const [tab, setTab] = useState<DrawerTab>('info');
  const [bloqueadoOpen, setBloqueadoOpen] = useState(false);

  return (
    <div className="ativ-drawer" role="region" aria-label="Detalhes da atividade">
      <div className="ativ-drawer__head">
        <div className="ativ-drawer__badges">
          <span className="atividade-card__numero">{a.numeroCard}</span>
          <span
            className={`atividade-card__momento ativ-drawer__select-chip ${getMomentoClass(a.momento)}`}
          >
            {a.momento}
            <Chevron />
          </span>
          <span className="ativ-drawer__tipo-badge ativ-drawer__select-chip">
            {TIPO_ICON[a.tipo] ?? '📌'} {TIPO_LABEL[a.tipo] ?? `Tipo ${a.tipo}`}
            <Chevron />
          </span>
        </div>
        <div className="ativ-drawer__head-actions">
          <button
            type="button"
            className="ativ-drawer__archive secondary compact"
            title="Arquivar atividade"
            aria-label="Arquivar"
            data-sound="close"
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

      <h3 className="ativ-drawer__title">{a.nome}</h3>

      <p className="ativ-drawer__board">
        <span className="ativ-drawer__field-label">Board</span>
        {a.timeBoard}
      </p>

      <div className="ativ-drawer__blocked-row">
        <div className="ativ-drawer__field">
          <span className="ativ-drawer__field-label">Bloqueado</span>
          <label
            className="switch"
            onClick={() => {
              if (info.bloqueado) setBloqueadoOpen((v) => !v);
            }}
          >
            <input type="checkbox" checked={info.bloqueado} readOnly aria-label="Bloqueado" />
            <span className="switch__track" />
            <span className="switch__thumb" />
          </label>
        </div>
        {info.bloqueado && bloqueadoOpen && info.motivoBloqueio && (
          <div className="ativ-drawer__blocked-reason">
            <span className="ativ-drawer__field-label">Motivo</span>
            <span>{info.motivoBloqueio}</span>
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
        {(['info', 'descricao', 'comentarios', 'historico', 'anexos'] as DrawerTab[]).map((t) => (
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
            <DrawerField label="Responsável" value={info.responsavel} />
            <DrawerField label="Projeto" value={info.projeto} placeholder="Sem projeto" />
            <DrawerField label="Épico" value={info.epico} placeholder="—" />
            <DrawerField label="História" value={info.historia} placeholder="—" />
            <DrawerField label="Sprint / Iteração" value={info.sprint} placeholder="—" />
            <DrawerField label="Esforço" value={formatEsforco(info.esforcoHoras)} placeholder="—" />
            <DrawerField
              label="Pontos (Fibonacci)"
              value={info.pontosEstimados != null ? fibLabel(info.pontosEstimados) : null}
              placeholder="—"
            />
            <DrawerField label="Data de início" value={info.dataInicio} placeholder="—/—/—" />
            <DrawerField label="Data de entrega" value={info.dataEntrega} placeholder="—/—/—" />
            <DrawerField
              label="Prev. entrega"
              value={info.dataPrevistaEntrega}
              placeholder="—/—/—"
            />
            <DrawerField label="Criado em" value={formatDateLong(a.dataCriacao)} />
          </div>
        </div>
      )}

      {tab === 'descricao' && (
        <div className="ativ-drawer__section ativ-drawer__tab-content">
          {info.descricao ? (
            <p className="ativ-drawer__desc">{info.descricao}</p>
          ) : (
            <EmptyState icon="📝" text="Nenhuma descrição cadastrada." />
          )}
        </div>
      )}

      {tab === 'comentarios' && (
        <div className="ativ-drawer__section ativ-drawer__tab-content">
          {info.comentarios.length > 0 ? (
            <div className="ativ-drawer__comments">
              {info.comentarios.map((c, i) => (
                <div key={i} className="ativ-drawer__comment">
                  <div className="ativ-drawer__comment-header">
                    <strong>{c.autor}</strong>
                    <span>{formatDate(c.data)}</span>
                  </div>
                  <p>{c.texto}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="💬" text="Nenhum comentário ainda." />
          )}
          <p className="ativ-drawer__coming-soon">Adicionar comentários disponível em breve.</p>
        </div>
      )}

      {tab === 'historico' && (
        <div className="ativ-drawer__section ativ-drawer__tab-content">
          {info.historico.length > 0 ? (
            <div className="ativ-drawer__history">
              {info.historico.map((h, i) => (
                <div key={i} className="ativ-drawer__history-item">
                  <span className="ativ-drawer__history-dot" />
                  <div>
                    <span className="ativ-drawer__history-action">{h.acao}</span>
                    <span className="ativ-drawer__history-meta">
                      {h.usuario} · {formatDate(h.data)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="📋" text="Nenhuma atividade registrada." />
          )}
          <p className="ativ-drawer__coming-soon">Histórico completo disponível em breve.</p>
        </div>
      )}

      {tab === 'anexos' && (
        <div className="ativ-drawer__section ativ-drawer__tab-content">
          {info.anexos.length > 0 ? (
            <div className="ativ-drawer__attachments">
              {info.anexos.map((f, i) => (
                <div key={i} className="ativ-drawer__attachment">
                  <span>📎</span>
                  <span>{f.nome}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="📎" text="Nenhum anexo encontrado." />
          )}
          <p className="ativ-drawer__coming-soon">Upload de anexos disponível em breve.</p>
        </div>
      )}
    </div>
  );
}

function Chevron() {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
      <path
        d="M1 3l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
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

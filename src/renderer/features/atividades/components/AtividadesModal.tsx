import { useCallback, useEffect, useRef, useState } from 'react';
import type { BeeforAtividade } from '@shared/types/index';
import { useIpc } from '../../../services/ipc';
import { ModalShell } from '../../../components/ui/ModalShell';
import { FunnyLoader } from '../../../components/common/FunnyLoader';
import { playUiSound } from '../../../utils/alarm';

const LS_KEY = 'beefor:ativ-split-ratio';
const RATIO_MIN = 0.25;
const RATIO_MAX = 0.75;
const RATIO_DEFAULT = 0.45;

function loadRatio(): number {
  try {
    const v = parseFloat(localStorage.getItem(LS_KEY) ?? '');
    if (v >= RATIO_MIN && v <= RATIO_MAX) return v;
  } catch {
    /* ignore */
  }
  return RATIO_DEFAULT;
}

function useResizeSplit(active: boolean) {
  const [ratio, setRatio] = useState(loadRatio);
  const bodyRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    if (!active) return;
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !bodyRef.current) return;
      const rect = bodyRef.current.getBoundingClientRect();
      const newRatio = Math.min(
        RATIO_MAX,
        Math.max(RATIO_MIN, (e.clientX - rect.left) / rect.width),
      );
      setRatio(newRatio);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setRatio((r) => {
        try {
          localStorage.setItem(LS_KEY, String(r));
        } catch {
          /* ignore */
        }
        return r;
      });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [active]);

  return { ratio, bodyRef, onMouseDown };
}

const TIPO_LABEL: Record<number, string> = {
  0: 'Outro',
  1: 'Tarefa',
  2: 'Bug',
  3: 'História',
  4: 'Epic',
  5: 'Melhoria',
  6: 'Suporte',
};

const TIPO_ICON: Record<number, string> = {
  0: '📌',
  1: '✅',
  2: '🐛',
  3: '📖',
  4: '🗂️',
  5: '⬆️',
  6: '🎧',
};

const FIBONACCI = [1, 2, 3, 5, 8, 13, 20, 40, 100];

function getMomentoClass(momento: string): string {
  const m = momento.toLowerCase();
  if (m.includes('backlog')) return 'momento--backlog';
  if (m.includes('andamento') || m.includes('progress')) return 'momento--progress';
  if (m.includes('conclu') || m.includes('done')) return 'momento--done';
  if (m.includes('fazer') || m.includes('to do') || m.includes('todo')) return 'momento--todo';
  return 'momento--default';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatEsforco(horas: number | null): string | null {
  if (horas == null) return null;
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// Mock data — endpoint real a conectar depois
function mockInfoFor(a: BeeforAtividade) {
  return {
    responsavel: 'Joao Henrique Batista',
    projeto: a.projeto !== 'Sem projeto' ? a.projeto : null,
    epico: null as string | null,
    historia: null as string | null,
    sprint: null as string | null,
    esforcoHoras: null as number | null,
    pontosEstimados: null as number | null,
    dataInicio: null as string | null,
    dataEntrega: null as string | null,
    dataPrevistaEntrega: null as string | null,
    descricao: null as string | null,
    bloqueado: false,
    motivoBloqueio: null as string | null,
    etiquetas: [] as string[],
    comentarios: [] as { autor: string; texto: string; data: string }[],
    anexos: [] as { nome: string; url: string; tipo: string }[],
    historico: [] as { acao: string; data: string; usuario: string }[],
  };
}

type DrawerTab = 'info' | 'descricao' | 'comentarios' | 'historico' | 'anexos';

interface DrawerProps {
  atividade: BeeforAtividade;
  onClose: () => void;
}

function AtividadeDrawer({ atividade: a, onClose }: DrawerProps) {
  const info = mockInfoFor(a);
  const [tab, setTab] = useState<DrawerTab>('info');
  const [bloqueadoOpen, setBloqueadoOpen] = useState(false);

  return (
    <div className="ativ-drawer" role="region" aria-label="Detalhes da atividade">
      {/* Head */}
      <div className="ativ-drawer__head">
        <div className="ativ-drawer__badges">
          <span className="atividade-card__numero">{a.numeroCard}</span>
          {/* Momento — mat-select style */}
          <span
            className={`atividade-card__momento ativ-drawer__select-chip ${getMomentoClass(a.momento)}`}
          >
            {a.momento}
            <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
              <path
                d="M1 3l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </span>
          {/* Tipo — mat-select style */}
          <span className="ativ-drawer__tipo-badge ativ-drawer__select-chip">
            {TIPO_ICON[a.tipo] ?? '📌'} {TIPO_LABEL[a.tipo] ?? `Tipo ${a.tipo}`}
            <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
              <path
                d="M1 3l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
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
            ✕
          </button>
        </div>
      </div>

      <h3 className="ativ-drawer__title">{a.nome}</h3>

      <p className="ativ-drawer__board">
        <span className="ativ-drawer__field-label">Board</span>
        {a.timeBoard}
      </p>

      {/* Bloqueado switch — mesmo padrão de settings */}
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

      {/* Etiquetas */}
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

      {/* Tabs nav */}
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

      {/* Tab: Informações */}
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

      {/* Tab: Descrição */}
      {tab === 'descricao' && (
        <div className="ativ-drawer__section ativ-drawer__tab-content">
          {info.descricao ? (
            <p className="ativ-drawer__desc">{info.descricao}</p>
          ) : (
            <div className="ativ-drawer__empty-state">
              <span>📝</span>
              <p>Nenhuma descrição cadastrada.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Comentários */}
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
            <div className="ativ-drawer__empty-state">
              <span>💬</span>
              <p>Nenhum comentário ainda.</p>
            </div>
          )}
          <p className="ativ-drawer__coming-soon">Adicionar comentários disponível em breve.</p>
        </div>
      )}

      {/* Tab: Histórico */}
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
            <div className="ativ-drawer__empty-state">
              <span>📋</span>
              <p>Nenhuma atividade registrada.</p>
            </div>
          )}
          <p className="ativ-drawer__coming-soon">Histórico completo disponível em breve.</p>
        </div>
      )}

      {/* Tab: Anexos */}
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
            <div className="ativ-drawer__empty-state">
              <span>📎</span>
              <p>Nenhum anexo encontrado.</p>
            </div>
          )}
          <p className="ativ-drawer__coming-soon">Upload de anexos disponível em breve.</p>
        </div>
      )}
    </div>
  );
}

function fibLabel(n: number): string {
  if (FIBONACCI.includes(n)) return String(n);
  return `${n} (custom)`;
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

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AtividadesModal({ open, onClose }: Props) {
  const { atividades: atividadesClient } = useIpc();
  const [atividades, setAtividades] = useState<BeeforAtividade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<number | null>(null);
  const [selected, setSelected] = useState<BeeforAtividade | null>(null);
  const { ratio, bodyRef, onMouseDown } = useResizeSplit(!!selected);

  const doFetch = useCallback(() => {
    setLoading(true);
    setError(null);
    atividadesClient.fetch().then((res) => {
      if (res.ok && res.data) {
        const sorted = [...res.data].sort(
          (a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime(),
        );
        setAtividades(sorted);
      } else {
        setError((res as any).error ?? 'Erro ao buscar atividades.');
      }
      setLoading(false);
    });
  }, [atividadesClient]);

  useEffect(() => {
    if (!open) return;
    playUiSound('activity-open');
    doFetch();
  }, [doFetch, open]);

  const tipos = [...new Set(atividades.map((a) => a.tipo))].sort();

  const filtered = atividades.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.nome.toLowerCase().includes(q) ||
      a.numeroCard.toLowerCase().includes(q) ||
      a.projeto.toLowerCase().includes(q) ||
      a.timeBoard.toLowerCase().includes(q) ||
      a.momento.toLowerCase().includes(q);
    const matchTipo = filterTipo === null || a.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  return (
    <ModalShell open={open} onClose={onClose} className="atividades-modal" labelledBy="ativ-title">
      <div className="modal-head">
        <div>
          <p className="eyebrow">Beefor</p>
          <h2 id="ativ-title">Minhas Atividades</h2>
          <p className="atividades-modal__subtitle">
            {loading ? 'Carregando...' : `${filtered.length} de ${atividades.length} atividades`}
          </p>
        </div>
        <div className="atividades-modal__head-actions">
          <button
            type="button"
            className="secondary compact"
            onClick={doFetch}
            data-sound="team-refresh"
          >
            Atualizar
          </button>
          <button type="button" className="secondary compact" onClick={onClose} data-sound="close">
            Fechar
          </button>
        </div>
      </div>

      <div className="atividades-modal__toolbar">
        <div className="atividades-search">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome, card, projeto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar atividades"
          />
        </div>

        {tipos.length > 1 && (
          <div className="atividades-tabs" role="tablist" aria-label="Filtrar por tipo">
            <button
              type="button"
              role="tab"
              aria-selected={filterTipo === null}
              className={filterTipo === null ? 'active' : ''}
              onClick={() => setFilterTipo(null)}
              data-sound="tab-home"
            >
              Todos
            </button>
            {tipos.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={filterTipo === t}
                className={filterTipo === t ? 'active' : ''}
                onClick={() => setFilterTipo(t)}
                data-sound="tab-home"
              >
                {TIPO_ICON[t] ?? ''} {TIPO_LABEL[t] ?? `Tipo ${t}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        ref={bodyRef}
        className={`atividades-modal__body ${selected ? 'atividades-modal__body--split' : ''}`}
        style={selected ? { gridTemplateColumns: `${ratio * 100}% 4px 1fr` } : undefined}
      >
        {loading ? (
          <FunnyLoader title="Buscando atividades" />
        ) : error ? (
          <div className="atividades-empty">
            <strong>Erro</strong>
            <span>{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="atividades-empty">
            <strong>Nenhuma atividade encontrada</strong>
            {search && <span>Tente outra busca.</span>}
          </div>
        ) : (
          <>
            <div className="atividades-list">
              {filtered.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`atividade-card ${selected?.id === a.id ? 'atividade-card--active' : ''}`}
                  onClick={() => setSelected(selected?.id === a.id ? null : a)}
                  data-sound="calendar-pick"
                  aria-pressed={selected?.id === a.id}
                >
                  <div className="atividade-card__header">
                    <span className="atividade-card__numero">{a.numeroCard}</span>
                    <span className={`atividade-card__momento ${getMomentoClass(a.momento)}`}>
                      {a.momento}
                    </span>
                  </div>
                  <p className="atividade-card__nome">{a.nome}</p>
                  <div className="atividade-card__meta">
                    <span className="atividade-card__tipo">
                      {TIPO_ICON[a.tipo] ?? ''} {TIPO_LABEL[a.tipo] ?? `Tipo ${a.tipo}`}
                    </span>
                    <span className="atividade-card__sep">·</span>
                    <span className="atividade-card__board">{a.timeBoard}</span>
                    {a.projeto !== 'Sem projeto' && (
                      <>
                        <span className="atividade-card__sep">·</span>
                        <span className="atividade-card__projeto">{a.projeto}</span>
                      </>
                    )}
                    <span className="atividade-card__sep">·</span>
                    <span className="atividade-card__data">{formatDate(a.dataCriacao)}</span>
                  </div>
                </button>
              ))}
            </div>

            {selected && (
              <>
                <div
                  className="atividades-resize-handle"
                  onMouseDown={onMouseDown}
                  title="Arrastar para redimensionar"
                  role="separator"
                  aria-orientation="vertical"
                />
                <AtividadeDrawer atividade={selected} onClose={() => setSelected(null)} />
              </>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}

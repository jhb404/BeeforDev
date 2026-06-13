import { useCallback, useEffect, useState } from 'react';
import type { BeeforAtividade } from '@shared/types/index';
import { useIpc } from '../../../services/ipc';
import { ModalShell } from '../../../components/ui/ModalShell';
import { FunnyLoader } from '../../../components/common/FunnyLoader';
import { playUiSound } from '../../../utils/alarm';
import { useResizeSplit } from '../hooks/useResizeSplit';
import { AtividadeDrawer } from './AtividadeDrawer';
import { AtividadeList } from './AtividadeList';
import { TIPO_ICON, TIPO_LABEL } from '../utils/atividadeDisplay';

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
        setError((res as { error?: string }).error ?? 'Erro ao buscar atividades.');
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

  const handleSelect = useCallback((atividade: BeeforAtividade) => {
    setSelected((current) => (current?.id === atividade.id ? null : atividade));
  }, []);

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

      <div className="atividades-dev-banner" role="alert">
        🚧 Esta funcionalidade está em desenvolvimento. Alguns dados podem estar incompletos ou
        mudar em breve.
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
            <AtividadeList
              atividades={filtered}
              selectedId={selected?.id ?? null}
              onSelect={handleSelect}
            />

            {selected && (
              <>
                <div
                  className="atividades-resize-handle"
                  onMouseDown={onMouseDown}
                  title="Arrastar para redimensionar"
                  role="separator"
                  aria-orientation="vertical"
                />
                <AtividadeDrawer
                  atividade={selected}
                  onClose={() => setSelected(null)}
                  onChanged={doFetch}
                />
              </>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}

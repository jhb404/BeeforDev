import { useState } from 'react';
import type { MappingItem } from '../hooks/usePerfilData';

type EditItens = Array<{ IdItem?: string; NomeItem: string }>;

interface Props {
  mapping: MappingItem[];
  onAdd: (titulo: string, itens: string[]) => Promise<boolean>;
  onEdit: (idTitulo: string, titulo: string, itens: EditItens) => Promise<boolean>;
  onDel: (idTitulo: string) => Promise<boolean>;
}

/** CRUD de personal mapping: lista de cards editáveis + formulário de criação. */
export function MappingBlock({ mapping, onAdd, onEdit, onDel }: Props) {
  const [adding, setAdding] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [itensTxt, setItensTxt] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function salvar() {
    const t = titulo.trim();
    if (!t || busy) return;
    const itens = itensTxt
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    setBusy(true);
    const ok = await onAdd(t, itens);
    setBusy(false);
    if (ok) {
      setTitulo('');
      setItensTxt('');
      setAdding(false);
    }
  }

  return (
    <>
      <div className="pfx-mapping">
        {mapping.length === 0 && <span className="pfx-empty">Sem personal mapping ainda.</span>}
        {mapping.map((m) =>
          editingId === (m.idTitulo || m.titulo) ? (
            <MappingCardEdit
              key={m.idTitulo || m.titulo}
              item={m}
              onSave={async (tit, itens) => {
                const ok = await onEdit(m.idTitulo, tit, itens);
                if (ok) setEditingId(null);
                return ok;
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <button
              key={m.idTitulo || m.titulo}
              type="button"
              className="pfx-mapping__card pfx-mapping__card--clickable"
              onClick={() => setEditingId(m.idTitulo || m.titulo)}
              title="Clique para editar"
              data-sound="click"
            >
              <div className="pfx-mapping__head">
                <strong>{m.titulo}</strong>
                <span
                  className="pfx-mapping__del"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    void onDel(m.idTitulo);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      void onDel(m.idTitulo);
                    }
                  }}
                  aria-label={`Remover ${m.titulo}`}
                  title="Remover"
                >
                  ×
                </span>
              </div>
              <ul>
                {m.itens.map((it, i) => (
                  <li key={i}>{it.nomeItem}</li>
                ))}
              </ul>
            </button>
          ),
        )}
      </div>

      {adding ? (
        <div className="pfx-mapping__form">
          <input
            type="text"
            placeholder="Título (ex.: Curiosidades, Família…)"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={80}
          />
          <textarea
            placeholder="Um item por linha…"
            value={itensTxt}
            onChange={(e) => setItensTxt(e.target.value)}
            rows={4}
          />
          <div className="pfx-mapping__form-actions">
            <button
              type="button"
              className="secondary compact"
              onClick={() => setAdding(false)}
              data-sound="click"
            >
              Cancelar
            </button>
            <button
              type="button"
              className="warm compact"
              disabled={busy || !titulo.trim()}
              onClick={() => void salvar()}
              data-sound="success"
            >
              {busy ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="secondary compact pfx-mapping__addbtn"
          onClick={() => setAdding(true)}
          data-sound="click"
        >
          + Adicionar mapping
        </button>
      )}
    </>
  );
}

interface EditProps {
  item: MappingItem;
  onSave: (titulo: string, itens: EditItens) => Promise<boolean>;
  onCancel: () => void;
}

/** Formulário inline de edição de um card de mapping. */
function MappingCardEdit({ item, onSave, onCancel }: EditProps) {
  const [titulo, setTitulo] = useState(item.titulo);
  const [itens, setItens] = useState<Array<{ idItem?: string; nomeItem: string }>>(
    item.itens.length ? item.itens.map((it) => ({ ...it })) : [{ nomeItem: '' }],
  );
  const [busy, setBusy] = useState(false);

  function setItem(idx: number, valor: string) {
    setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, nomeItem: valor } : it)));
  }
  function addItem() {
    setItens((prev) => [...prev, { nomeItem: '' }]);
  }
  function delItem(idx: number) {
    setItens((prev) => prev.filter((_, i) => i !== idx));
  }

  async function salvar() {
    const t = titulo.trim();
    if (!t || busy) return;
    const limpos = itens
      .map((it) => ({ IdItem: it.idItem, NomeItem: it.nomeItem.trim() }))
      .filter((it) => it.NomeItem);
    setBusy(true);
    await onSave(t, limpos);
    setBusy(false);
  }

  return (
    <div className="pfx-mapping__card pfx-mapping__card--editing">
      <input
        type="text"
        className="pfx-mapping__edit-title"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título"
        maxLength={80}
        autoFocus
      />
      <div className="pfx-mapping__edit-itens">
        {itens.map((it, i) => (
          <div key={it.idItem ?? i} className="pfx-mapping__edit-row">
            <span className="pfx-mapping__edit-dot" />
            <input
              type="text"
              value={it.nomeItem}
              onChange={(e) => setItem(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem();
                }
              }}
              placeholder="Item…"
              maxLength={120}
            />
            <button
              type="button"
              className="pfx-mapping__del"
              onClick={() => delItem(i)}
              aria-label="Remover item"
              title="Remover item"
              data-sound="click"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="pfx-mapping__edit-additem"
          onClick={addItem}
          data-sound="click"
        >
          + item
        </button>
      </div>
      <div className="pfx-mapping__form-actions">
        <button
          type="button"
          className="secondary compact"
          onClick={onCancel}
          disabled={busy}
          data-sound="click"
        >
          Cancelar
        </button>
        <button
          type="button"
          className="warm compact"
          disabled={busy || !titulo.trim()}
          onClick={() => void salvar()}
          data-sound="success"
        >
          {busy ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}

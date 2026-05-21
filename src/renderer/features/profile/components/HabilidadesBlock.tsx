import { useState } from 'react';
import type { HabilidadeItem } from '../hooks/usePerfilData';

interface Props {
  habilidades: HabilidadeItem[];
  combo: HabilidadeItem[];
  onAdd: (nome: string) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
}

/** Lista de habilidades como pílulas (clique remove) + input e sugestões. */
export function HabilidadesBlock({ habilidades, combo, onAdd, onRemove }: Props) {
  const [novaHab, setNovaHab] = useState('');
  const [busy, setBusy] = useState(false);

  const sugestoes = combo
    .filter((c) => !habilidades.some((h) => h.nome.toLowerCase() === c.nome.toLowerCase()))
    .filter((c) => !novaHab || c.nome.toLowerCase().includes(novaHab.toLowerCase()))
    .slice(0, 6);

  async function add(nome: string) {
    const n = nome.trim();
    if (!n || busy) return;
    setBusy(true);
    const ok = await onAdd(n);
    if (ok) setNovaHab('');
    setBusy(false);
  }

  return (
    <>
      <div className="pfx-chips">
        {habilidades.length === 0 && <span className="pfx-empty">Nenhuma habilidade.</span>}
        {habilidades.map((h) => (
          <button
            type="button"
            key={h.id || h.nome}
            className="pfx-hability-tag"
            onClick={() => void onRemove(h.id)}
            title={`Remover ${h.nome}`}
            aria-label={`Remover ${h.nome}`}
            data-sound="click"
          >
            <span className="pfx-hability-tag__txt">{h.nome}</span>
          </button>
        ))}
      </div>
      <div className="pfx-add">
        <input
          type="text"
          value={novaHab}
          placeholder="Adicionar habilidade…"
          onChange={(e) => setNovaHab(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void add(novaHab);
          }}
          maxLength={80}
        />
        <button
          type="button"
          className="warm compact"
          disabled={busy || !novaHab.trim()}
          onClick={() => void add(novaHab)}
          data-sound="click"
        >
          {busy ? '…' : '+'}
        </button>
      </div>
      {sugestoes.length > 0 && (
        <div className="pfx-suggest">
          {sugestoes.map((s) => (
            <button
              key={s.id || s.nome}
              type="button"
              className="pfx-suggest__chip"
              onClick={() => void add(s.nome)}
              data-sound="click"
            >
              + {s.nome}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

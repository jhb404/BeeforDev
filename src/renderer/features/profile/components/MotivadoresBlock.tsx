import { useState } from 'react';
import type { MotivadorItem } from '../hooks/usePerfilData';
import { motivadorEmoji } from '../utils/motivadorEmoji';

interface Props {
  motivadores: MotivadorItem[];
  onReorder: (ordenados: MotivadorItem[]) => Promise<boolean>;
}

/** Trilha de motivadores reordenável por drag-and-drop (mais → menos importante). */
export function MotivadoresBlock({ motivadores, onReorder }: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  if (motivadores.length === 0) {
    return <span className="pfx-empty">Sem motivadores definidos no Beefor.</span>;
  }

  function handleDrop(target: number) {
    if (dragIdx === null || dragIdx === target) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const next = [...motivadores];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(target, 0, moved);
    setDragIdx(null);
    setOverIdx(null);
    void onReorder(next);
  }

  return (
    <>
      <p className="pfx-motiv__hint">
        Arraste para reordenar do mais (1) ao menos importante (10).
      </p>
      <ol className="pfx-motiv-track">
        {motivadores.map((m, idx) => (
          <li
            key={m.idMotivador || m.nome}
            className={`pfx-motiv-card ${dragIdx === idx ? 'pfx-motiv-card--dragging' : ''} ${overIdx === idx ? 'pfx-motiv-card--over' : ''}`}
            draggable
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIdx(idx);
            }}
            onDragLeave={() => setOverIdx((o) => (o === idx ? null : o))}
            onDrop={() => handleDrop(idx)}
            onDragEnd={() => {
              setDragIdx(null);
              setOverIdx(null);
            }}
            title={m.nome}
          >
            <span className="pfx-motiv-card__rank">{idx + 1}</span>
            <span className="pfx-motiv-card__emoji">{motivadorEmoji(m.nome)}</span>
            <span className="pfx-motiv-card__nome">{m.nome}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

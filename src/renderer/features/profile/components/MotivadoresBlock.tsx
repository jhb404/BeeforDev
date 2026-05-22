import { useState, type DragEvent } from 'react';
import type { MotivadorItem } from '../hooks/usePerfilData';
import { motivadorEmoji } from '../utils/motivadorEmoji';
import { motivadorDesc } from '../utils/motivadorDesc';

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

  // handlers de drag compartilhados (índice = posição real no ranking)
  const dragProps = (idx: number) => ({
    draggable: true,
    onDragStart: () => setDragIdx(idx),
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      setOverIdx(idx);
    },
    onDragLeave: () => setOverIdx((o) => (o === idx ? null : o)),
    onDrop: () => handleDrop(idx),
    onDragEnd: () => {
      setDragIdx(null);
      setOverIdx(null);
    },
  });

  const medal = ['🥇', '🥈', '🥉'];
  const top = motivadores.slice(0, 3);
  const rest = motivadores.slice(3);
  // ordem visual do pódio: 2º · 1º (centro/elevado) · 3º
  const podiumOrder = [1, 0, 2].filter((i) => i < top.length);

  return (
    <>
      <p className="pfx-motiv__hint">
        Arraste para reordenar do mais (1) ao menos importante (10).
      </p>

      <div className="pfx-motiv-podium">
        {podiumOrder.map((idx) => {
          const m = motivadores[idx];
          const rank = idx + 1;
          return (
            <div
              key={m.idMotivador || m.nome}
              className={`pfx-motiv-pod pfx-motiv-pod--p${rank} ${dragIdx === idx ? 'pfx-motiv-pod--dragging' : ''} ${overIdx === idx ? 'pfx-motiv-pod--over' : ''}`}
              {...dragProps(idx)}
              data-tooltip={`${m.nome} — ${motivadorDesc(m.nome)}`}
            >
              <span className="pfx-motiv-pod__medal">{medal[idx]}</span>
              <span className="pfx-motiv-card__emoji">{motivadorEmoji(m.nome)}</span>
              <span className="pfx-motiv-card__nome">{m.nome}</span>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <ol className="pfx-motiv-grid">
          {rest.map((m, j) => {
            const idx = j + 3;
            return (
              <li
                key={m.idMotivador || m.nome}
                className={`pfx-motiv-card ${dragIdx === idx ? 'pfx-motiv-card--dragging' : ''} ${overIdx === idx ? 'pfx-motiv-card--over' : ''}`}
                {...dragProps(idx)}
                data-tooltip={`${m.nome} — ${motivadorDesc(m.nome)}`}
              >
                <span className="pfx-motiv-card__rank">{idx + 1}</span>
                <span className="pfx-motiv-card__emoji">{motivadorEmoji(m.nome)}</span>
                <span className="pfx-motiv-card__nome">{m.nome}</span>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

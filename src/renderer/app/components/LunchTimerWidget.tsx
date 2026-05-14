import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 60 * 60 * 1000;

interface Props {
  active: boolean;
  startedAt: number | null;
  onCancel: () => void;
}

function fmt(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function LunchTimerWidget({ active, startedAt, onCancel }: Props) {
  const [remaining, setRemaining] = useState(DURATION_MS);
  const [confirm, setConfirm] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || startedAt === null) {
      setRemaining(DURATION_MS);
      setConfirm(false);
      return;
    }
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const left = DURATION_MS - elapsed;
      setRemaining(left);
      if (left > 0) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [active, startedAt]);

  if (!active) return null;

  const pct = Math.max(0, Math.min(1, remaining / DURATION_MS));

  return (
    <>
      <button
        type="button"
        className="lunch-timer-pill"
        onClick={() => setConfirm(true)}
        title="Timer de almoço — clique para opções"
        data-sound="click"
      >
        <svg className="lunch-timer-pill__ring" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8" className="lunch-timer-pill__ring-bg" />
          <circle
            cx="10"
            cy="10"
            r="8"
            className="lunch-timer-pill__ring-fill"
            strokeDasharray={`${2 * Math.PI * 8}`}
            strokeDashoffset={`${2 * Math.PI * 8 * (1 - pct)}`}
          />
        </svg>
        <span className="lunch-timer-pill__time">{fmt(remaining)}</span>
      </button>

      {confirm && (
        <div className="modal-backdrop" role="presentation" onClick={() => setConfirm(false)}>
          <section
            className="modal-card lunch-timer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lunch-timer-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">Almoço</p>
                <h2 id="lunch-timer-title">Timer em andamento</h2>
                <p className="lunch-timer-modal__subtitle">
                  Restam <strong>{fmt(remaining)}</strong> de 1 hora.
                </p>
              </div>
              <div className="lunch-timer-modal__head-actions">
                <button
                  type="button"
                  className="secondary compact"
                  onClick={() => setConfirm(false)}
                  data-sound="close"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="lunch-timer-modal__body">
              <p>
                Continuar o timer ou cancelar e voltar ao trabalho? O alerta de fim toca quando
                bater 1 hora.
              </p>
              <div className="lunch-timer-modal__actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setConfirm(false)}
                  data-sound="click"
                >
                  Continuar
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    setConfirm(false);
                    onCancel();
                  }}
                  data-sound="close"
                >
                  Cancelar timer
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

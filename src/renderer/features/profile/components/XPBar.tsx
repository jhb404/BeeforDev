interface Props {
  xp: number;
  xpNext: number;
  pct: number;
  onHelp: () => void;
}

/** Barra de progresso de XP com rótulo, valores e botão de ajuda. */
export function XPBar({ xp, xpNext, pct, onHelp }: Props) {
  return (
    <div className="pfx-xp">
      <div className="pfx-xp__head">
        <span className="pfx-xp__label">XP</span>
        <span className="pfx-xp__txt">
          {xp} / {xpNext}
          <button
            type="button"
            className="pfx-xp__help"
            onClick={onHelp}
            aria-label="Como funciona o XP"
            title="Como funciona o XP"
          >
            ?
          </button>
        </span>
      </div>
      <div className="pfx-xp__bar">
        <div className="pfx-xp__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

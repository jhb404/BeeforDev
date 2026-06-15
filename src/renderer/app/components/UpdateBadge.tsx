import { useState } from 'react';
import { Download } from '../../components/common/Icons';
import { useUpdater } from '../../hooks/useUpdater';

export function UpdateBadge() {
  const { state, install } = useUpdater();
  const [popoverOpen, setPopoverOpen] = useState(false);

  if (state.status === 'idle') return null;

  const ready = state.status === 'ready';

  const handleClick = () => {
    if (ready) {
      install();
    } else {
      setPopoverOpen((v) => !v);
    }
  };

  const label = ready
    ? `Atualização v${state.version} pronta — clique para instalar`
    : `Baixando atualização v${state.version}...`;

  return (
    <div className="update-badge-wrap">
      <button
        type="button"
        className={`update-badge ${ready ? 'update-badge--ready' : 'update-badge--downloading'}`}
        title={label}
        onClick={handleClick}
        aria-label={label}
        aria-expanded={!ready ? popoverOpen : undefined}
      >
        <Download size={15} />
        {ready && <span className="update-badge__dot" aria-hidden="true" />}
      </button>

      {popoverOpen && !ready && (
        <div className="update-badge-popover" role="status">
          <div className="update-badge-popover__header">
            <Download size={14} />
            <span>Baixando atualização</span>
          </div>
          <p className="update-badge-popover__version">v{state.version}</p>
          <p className="update-badge-popover__hint">
            O app vai reiniciar automaticamente quando o download terminar.
          </p>
        </div>
      )}
    </div>
  );
}

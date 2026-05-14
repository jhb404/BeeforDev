import { useUpdater } from '../../hooks/useUpdater';

export function UpdateBadge() {
  const { state, install } = useUpdater();

  if (state.status === 'idle') return null;

  const ready = state.status === 'ready';
  const title = ready
    ? `Atualização v${state.version} pronta — clique para instalar`
    : `Baixando atualização v${state.version}...`;

  return (
    <button
      type="button"
      className={`update-badge ${ready ? 'update-badge--ready' : 'update-badge--downloading'}`}
      title={title}
      onClick={ready ? install : undefined}
      disabled={!ready}
      aria-label={title}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {ready && <span className="update-badge__dot" aria-hidden="true" />}
    </button>
  );
}

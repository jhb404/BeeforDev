interface Props {
  visible: boolean;
  version?: string;
}

export function UpdateOverlay({ visible, version }: Props) {
  if (!visible) return null;
  return (
    <div className="update-overlay" role="alert" aria-live="assertive">
      <div className="update-overlay__card">
        <div className="update-overlay__spinner" aria-hidden="true" />
        <h2 className="update-overlay__title">Atualizando Beefor</h2>
        <p className="update-overlay__sub">
          {version ? `Instalando v${version}...` : 'Instalando atualização...'}
        </p>
        <p className="update-overlay__hint">App vai reiniciar sozinho 🚀</p>
      </div>
    </div>
  );
}

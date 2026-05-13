interface Props {
  kind: 'ok' | 'err';
  msg: string;
}

export function Coin2uToast({ kind, msg }: Props) {
  return (
    <div className={`toast ${kind}`} role={kind === 'err' ? 'alert' : 'status'}>
      <span className="toast__icon" aria-hidden="true">
        {kind === 'ok' ? '✓' : '!'}
      </span>
      <span className="toast__body">
        <strong>{kind === 'ok' ? 'Tudo certo' : 'Atencao'}</strong>
        <span>{msg}</span>
      </span>
    </div>
  );
}

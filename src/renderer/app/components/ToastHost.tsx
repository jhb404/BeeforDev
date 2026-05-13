import { useToastState } from '../providers/ToastProvider';

export function ToastHost() {
  const toast = useToastState();
  if (!toast) return null;
  return (
    <div
      className={`toast ${toast.kind}`}
      role={toast.kind === 'err' ? 'alert' : 'status'}
    >
      <span className="toast__icon" aria-hidden="true">
        {toast.kind === 'ok' ? '✓' : '!'}
      </span>
      <span className="toast__body">
        <strong>
          {toast.title ?? (toast.kind === 'ok' ? 'Tudo certo' : 'Atenção')}
        </strong>
        <span>{toast.msg}</span>
      </span>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { validateThemeCode, validateIconCode, redeemTheme, redeemIcon } from '../unlockCodes';

interface Props {
  open: boolean;
  onClose: () => void;
  kind: 'theme' | 'icon';
  /** Target ID — theme preset id or icon variant id */
  targetId: string;
  /** Display name for header */
  targetName: string;
  /** Achievement ID the item normally requires (shows in modal copy) */
  requiresAchievement?: string | null;
  onUnlocked?: () => void;
}

export function UnlockCodeModal({
  open,
  onClose,
  kind,
  targetId,
  targetName,
  requiresAchievement,
  onUnlocked,
}: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCode('');
      setError(null);
      setSuccess(false);
      // Autofocus after modal animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Cola o código aí.');
      return;
    }
    const valid =
      kind === 'theme'
        ? await validateThemeCode(targetId, trimmed)
        : await validateIconCode(targetId, trimmed);

    if (valid) {
      if (kind === 'theme') redeemTheme(targetId);
      else redeemIcon(targetId);
      setSuccess(true);
      setError(null);
      setTimeout(() => {
        onUnlocked?.();
        onClose();
      }, 1100);
    } else {
      setError('Código inválido. Tenta de novo ou pede outro.');
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void handleSubmit();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      className="unlock-code-modal"
      labelledBy="unlock-code-title"
    >
      <div className="modal-head">
        <div>
          <p className="eyebrow">{kind === 'theme' ? 'Tema' : 'Ícone'} bloqueado</p>
          <h2 id="unlock-code-title">🔐 Tem um código?</h2>
          <p className="unlock-code__subtitle">
            <strong>{targetName}</strong> desbloqueia ao completar a conquista
            {requiresAchievement ? (
              <>
                {' '}
                "<em>{requiresAchievement}</em>"
              </>
            ) : null}
            . Mas se você tem um código secreto, cola aqui.
          </p>
        </div>
        <button type="button" className="secondary compact" onClick={onClose} data-sound="close">
          Fechar
        </button>
      </div>

      <div className="unlock-code__body">
        {success ? (
          <div className="unlock-code__success">
            <span className="unlock-code__success-icon" aria-hidden="true">
              ✨
            </span>
            <strong>Desbloqueado!</strong>
            <span>{targetName} já tá disponível.</span>
          </div>
        ) : (
          <>
            <div className="unlock-code__input-wrap">
              <input
                ref={inputRef}
                type="text"
                className="unlock-code__input"
                placeholder="ex: meu-codigo-2026"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={handleKey}
                autoComplete="off"
                spellCheck={false}
              />
              {error && <span className="unlock-code__error">{error}</span>}
            </div>

            <div className="unlock-code__hint">
              💡 Não tem código? Chama o <strong>JB no Discord</strong> (jbatista404) explicando o
              motivo. Códigos são distribuídos manualmente — quem sabe ele libera 😉
            </div>

            <div className="unlock-code__actions">
              <button type="button" className="secondary" onClick={onClose} data-sound="close">
                Cancelar
              </button>
              <button type="button" onClick={() => void handleSubmit()} data-sound="click">
                Desbloquear
              </button>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}

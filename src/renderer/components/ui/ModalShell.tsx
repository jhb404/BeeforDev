import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Extra CSS classes on the modal-card section */
  className?: string;
  /** aria-labelledby value — point to the h2 id inside children */
  labelledBy?: string;
  /** aria-label fallback when no labelledBy */
  label?: string;
  children: ReactNode;
  /** Disable ESC close (e.g. when a nested confirm dialog is open) */
  disableEsc?: boolean;
}

export function ModalShell({
  open,
  onClose,
  className,
  labelledBy,
  label,
  children,
  disableEsc = false,
}: Props) {
  useEscapeToClose(open && !disableEsc, onClose);
  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop" role="presentation">
      <section
        className={`modal-card${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        {...(labelledBy ? { 'aria-labelledby': labelledBy } : {})}
        {...(label && !labelledBy ? { 'aria-label': label } : {})}
      >
        {children}
      </section>
    </div>,
    document.body,
  );
}

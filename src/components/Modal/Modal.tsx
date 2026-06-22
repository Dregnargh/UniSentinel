import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { XIcon } from '../../lib/icons';

export interface ModalProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Controls visibility. When `false` the dialog renders nothing. */
  open: boolean;
  /** Called when the overlay, the close button, or the Escape key requests a close. */
  onClose: () => void;
  /** Dialog width preset. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional title — when set, an auto header with a close button is rendered. */
  title?: React.ReactNode;
  /** Close the dialog when the backdrop is clicked. Defaults to `true`. */
  closeOnOverlayClick?: boolean;
  /** Hide the auto header's close button (only relevant when `title` is set). */
  hideClose?: boolean;
}

export interface ModalSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalHeader = React.forwardRef<HTMLDivElement, ModalSectionProps>(
  function ModalHeader({ className, ...rest }, ref) {
    return <div ref={ref} className={cn('us-modal__header', className)} {...rest} />;
  },
);

const ModalBody = React.forwardRef<HTMLDivElement, ModalSectionProps>(
  function ModalBody({ className, ...rest }, ref) {
    return <div ref={ref} className={cn('us-modal__body', className)} {...rest} />;
  },
);

const ModalFooter = React.forwardRef<HTMLDivElement, ModalSectionProps>(
  function ModalFooter({ className, ...rest }, ref) {
    return <div ref={ref} className={cn('us-modal__footer', className)} {...rest} />;
  },
);

const ModalBase = React.forwardRef<HTMLDivElement, ModalProps>(function ModalRoot(
  {
    open,
    onClose,
    size = 'md',
    title,
    closeOnOverlayClick = true,
    hideClose = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleOverlayMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  const node = (
    <div className="us-modal-overlay" onMouseDown={handleOverlayMouseDown}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn('us-modal', `us-modal--${size}`, className)}
        onMouseDown={(event) => event.stopPropagation()}
        {...rest}
      >
        {title != null && (
          <div className="us-modal__header">
            <h2 className="us-modal__title">{title}</h2>
            {!hideClose && (
              <button
                type="button"
                className="us-modal__close"
                aria-label="Close"
                onClick={onClose}
              >
                <XIcon size={18} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(node, document.body);
  }
  return node;
});

interface ModalComponent
  extends React.ForwardRefExoticComponent<
    ModalProps & React.RefAttributes<HTMLDivElement>
  > {
  Header: typeof ModalHeader;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
}

/**
 * Accessible dialog rendered into a portal on `document.body`. Closes on
 * Escape, on backdrop click, and via the auto header's close button. Compose
 * content with `Modal.Header`, `Modal.Body`, and `Modal.Footer`.
 *
 * @example
 * <Modal open={open} onClose={close} title="Confirm remediation" size="sm">
 *   <Modal.Body>Mark all overdue access reviews as resolved?</Modal.Body>
 *   <Modal.Footer>
 *     <Button variant="outline" onClick={close}>Cancel</Button>
 *     <Button variant="primary" onClick={confirm}>Confirm</Button>
 *   </Modal.Footer>
 * </Modal>
 * @category Overlay
 */
export const Modal = Object.assign(ModalBase, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
}) as ModalComponent;

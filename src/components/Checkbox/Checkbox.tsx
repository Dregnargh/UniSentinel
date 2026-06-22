import * as React from 'react';
import { cn } from '../../lib/cn';
import type { Size } from '../../lib/types';
import { CheckIcon, MinusIcon } from '../../lib/icons';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /** Control / box size. */
  size?: Size;
  /** Visible label rendered next to the box. */
  label?: React.ReactNode;
  /** Muted helper line beneath the label. */
  description?: React.ReactNode;
  /** Show the indeterminate (mixed) state. Not a native HTML attribute. */
  indeterminate?: boolean;
  /** Render the error (danger) styling and set `aria-invalid`. */
  invalid?: boolean;
}

/**
 * Custom-styled checkbox built on a real `<input type="checkbox">`, with an
 * optional label, description, and an indeterminate (mixed) state.
 *
 * @example
 * <Checkbox label="Enforce MFA" description="Required for all admins" defaultChecked />
 * @category Forms
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    size = 'md',
    label,
    description,
    indeterminate = false,
    invalid = false,
    className,
    disabled,
    ...rest
  },
  ref,
) {
  const innerRef = React.useRef<HTMLInputElement | null>(null);

  const setRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  React.useEffect(() => {
    if (innerRef.current) {
      innerRef.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  return (
    <label
      className={cn('us-checkbox', `us-checkbox--${size}`, className)}
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
    >
      <input
        ref={setRef}
        type="checkbox"
        className="us-checkbox__control us-visually-hidden"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      <span className="us-checkbox__box" aria-hidden="true">
        <CheckIcon className="us-checkbox__icon us-checkbox__icon--check" />
        <MinusIcon className="us-checkbox__icon us-checkbox__icon--minus" />
      </span>
      {(label != null || description != null) && (
        <span className="us-checkbox__text">
          {label != null && <span className="us-checkbox__label">{label}</span>}
          {description != null && (
            <span className="us-checkbox__desc">{description}</span>
          )}
        </span>
      )}
    </label>
  );
});

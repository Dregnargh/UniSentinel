import * as React from 'react';
import { cn } from '../../lib/cn';
import type { Size } from '../../lib/types';

export type ButtonVariant =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. `primary` is brand navy, `accent` is brand teal. */
  variant?: ButtonVariant;
  /** Control height / padding / font size. */
  size?: Size;
  /** Stretch to the full width of the container. */
  fullWidth?: boolean;
  /** Show a spinner and disable interaction while an action is in flight. */
  loading?: boolean;
  /** Icon rendered before the label. */
  leftIcon?: React.ReactNode;
  /** Icon rendered after the label. */
  rightIcon?: React.ReactNode;
  /** Square icon-only button (pass a single icon as children). */
  iconOnly?: boolean;
}

/**
 * Primary action control. Six variants across the brand palette, three sizes,
 * with built-in loading and icon slots.
 *
 * @example
 * <Button variant="primary" leftIcon={<ShieldIcon />}>Run assessment</Button>
 * @category Actions
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    iconOnly = false,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'us-btn',
        `us-btn--${variant}`,
        `us-btn--${size}`,
        {
          'us-btn--full': fullWidth,
          'us-btn--icon-only': iconOnly,
          'us-btn--loading': loading,
        },
        className,
      )}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="us-btn__spinner" aria-hidden="true" />}
      {!loading && leftIcon && <span className="us-btn__icon">{leftIcon}</span>}
      {children != null && <span className="us-btn__label">{children}</span>}
      {!loading && rightIcon && <span className="us-btn__icon">{rightIcon}</span>}
    </button>
  );
});

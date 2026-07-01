import * as React from 'react';
import { cn } from '../../lib/cn';
import type { Size } from '../../lib/types';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Control height / padding / font size. */
  size?: Size;
  /** Render the error (danger) styling. */
  invalid?: boolean;
  /** Adornment rendered inside the field, before the text. */
  leftIcon?: React.ReactNode;
  /** Adornment rendered inside the field, after the text. */
  rightIcon?: React.ReactNode;
  /** Class applied to the field wrapper (the bordered box). */
  className?: string;
}

/**
 * Single-line text field with optional inline icons and an error state.
 * The bordered wrapper owns the focus ring so left/right adornments sit
 * inside the same box as the text.
 *
 * @example
 * <Input placeholder="Search controls…" leftIcon={<SearchIcon />} />
 * @category Forms
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', invalid = false, leftIcon, rightIcon, className, disabled, ...rest },
  ref,
) {
  return (
    <div
      className={cn('us-field', `us-field--${size}`, className)}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
    >
      {leftIcon && <span className="us-field__icon">{leftIcon}</span>}
      <input
        ref={ref}
        className="us-input"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      {rightIcon && <span className="us-field__icon">{rightIcon}</span>}
    </div>
  );
});

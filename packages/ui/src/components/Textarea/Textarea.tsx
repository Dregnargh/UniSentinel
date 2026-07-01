import * as React from 'react';
import { cn } from '../../lib/cn';
import type { Size } from '../../lib/types';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Control padding / font size. */
  size?: Size;
  /** Render the error (danger) styling and set `aria-invalid`. */
  invalid?: boolean;
  /** Which axes the user may resize. */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

/**
 * Multiline text field. Matches the Input field box visually, but resizes and
 * holds multiple rows of text.
 *
 * @example
 * <Textarea placeholder="Describe the finding…" rows={4} invalid />
 * @category Forms
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      size = 'md',
      invalid = false,
      resize = 'vertical',
      rows = 3,
      className,
      style,
      disabled,
      ...rest
    },
    ref,
  ) {
    return (
      <textarea
        ref={ref}
        className={cn('us-textarea', `us-textarea--${size}`, className)}
        rows={rows}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        data-invalid={invalid || undefined}
        style={{ resize, ...style }}
        {...rest}
      />
    );
  },
);

import * as React from 'react';
import { cn } from '../../lib/cn';
import type { Size } from '../../lib/types';
import { ChevronDownIcon } from '../../lib/icons';

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Control height / padding / font size. */
  size?: Size;
  /** Render the error (danger) styling and set `aria-invalid`. */
  invalid?: boolean;
  /** Disabled, hidden first option shown until a real value is chosen. */
  placeholder?: string;
  /** Class applied to the wrapper (the bordered box). */
  className?: string;
}

/**
 * Styled native dropdown. Wraps a native `<select>` so the listbox stays
 * accessible while the closed control matches the Input field box.
 *
 * @example
 * <Select placeholder="Choose a framework" defaultValue="">
 *   <option value="soc2">SOC 2</option>
 *   <option value="iso">ISO 27001</option>
 * </Select>
 * @category Forms
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { size = 'md', invalid = false, placeholder, className, disabled, children, ...rest },
  ref,
) {
  return (
    <div
      className={cn('us-select', `us-select--${size}`, className)}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
    >
      <select
        ref={ref}
        className="us-select__control"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...rest}
      >
        {placeholder != null && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <span className="us-select__chevron" aria-hidden="true">
        <ChevronDownIcon size={16} />
      </span>
    </div>
  );
});

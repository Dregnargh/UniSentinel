import * as React from 'react';
import { cn } from '../../lib/cn';
import type { Size } from '../../lib/types';

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /** Control size. */
  size?: Size;
  /** Text rendered beside the switch. */
  label?: React.ReactNode;
  /** Place the label before (`left`) or after (`right`) the track. */
  labelPosition?: 'left' | 'right';
}

/**
 * Boolean on/off toggle backed by a real checkbox with `role="switch"`.
 *
 * @example
 * <Switch label="Enable continuous monitoring" defaultChecked />
 * @category Forms
 */
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { size = 'md', label, labelPosition = 'right', className, disabled, ...rest },
  ref,
) {
  return (
    <label
      className={cn('us-switch', `us-switch--${size}`, className)}
      data-disabled={disabled || undefined}
      data-label-pos={labelPosition}
    >
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        className="us-switch__control us-visually-hidden"
        disabled={disabled}
        {...rest}
      />
      <span className="us-switch__track" aria-hidden="true">
        <span className="us-switch__thumb" />
      </span>
      {label != null && <span className="us-switch__label">{label}</span>}
    </label>
  );
});

import * as React from 'react';
import { cn } from '../../lib/cn';
import type { Size } from '../../lib/types';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Layout axis. Vertical dividers sit inline between siblings. */
  orientation?: 'horizontal' | 'vertical';
  /** Line style. */
  variant?: 'solid' | 'dashed';
  /** Margin around the divider (block for horizontal, inline for vertical). */
  spacing?: Size;
  /** Optional centered label (horizontal only). */
  label?: React.ReactNode;
}

/**
 * Visual separator between content. Horizontal by default; pass a `label` to
 * split the line around centered text, or `orientation="vertical"` for an
 * inline divider.
 *
 * @example
 * <Divider label="or" />
 * @category Layout
 */
export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(function Divider(
  {
    orientation = 'horizontal',
    variant = 'solid',
    spacing = 'md',
    label,
    className,
    children,
    ...rest
  },
  ref,
) {
  if (orientation === 'vertical') {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="vertical"
        className={cn(
          'us-divider',
          'us-divider--vertical',
          `us-divider--${spacing}`,
          `us-divider--${variant}`,
          className,
        )}
        {...rest}
      />
    );
  }

  const hasLabel = label != null;
  return (
    <div
      ref={ref}
      role="separator"
      className={cn(
        'us-divider',
        'us-divider--horizontal',
        `us-divider--${spacing}`,
        `us-divider--${variant}`,
        { 'us-divider--labelled': hasLabel },
        className,
      )}
      {...rest}
    >
      {hasLabel && (
        <>
          <span className="us-divider__line" aria-hidden="true" />
          <span className="us-divider__label">{label}</span>
          <span className="us-divider__line" aria-hidden="true" />
        </>
      )}
    </div>
  );
});

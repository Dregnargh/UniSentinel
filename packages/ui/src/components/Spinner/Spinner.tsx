import * as React from 'react';
import { cn } from '../../lib/cn';
import type { Tone } from '../../lib/types';

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Named size (`sm` 16, `md` 24, `lg` 36) or an explicit pixel diameter. */
  size?: 'sm' | 'md' | 'lg' | number;
  /** Semantic tone — drives the ring color via the shared tone system. */
  tone?: Tone;
  /** Accessible status text announced to assistive tech. */
  label?: string;
}

/**
 * Indeterminate loading indicator. Sizes map to the control scale, or pass a
 * number for a custom diameter. Tone colors the ring.
 *
 * @example
 * <Spinner tone="brand" label="Loading report" />
 * @category Feedback
 */
export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 'md', tone = 'brand', label, className, style, ...rest },
  ref,
) {
  const isNumeric = typeof size === 'number';
  const mergedStyle: React.CSSProperties | undefined = isNumeric
    ? { ...style, ['--us-spinner-size' as string]: `${size}px` }
    : style;

  return (
    <span
      ref={ref}
      role="status"
      data-us-tone={tone}
      className={cn('us-spinner', !isNumeric && `us-spinner--${size}`, className)}
      style={mergedStyle}
      {...rest}
    >
      <span className="us-spinner__ring" aria-hidden="true" />
      <span className="us-visually-hidden">{label ?? 'Loading'}</span>
    </span>
  );
});

import * as React from 'react';
import { cn } from '../../lib/cn';
import type { Tone } from '../../lib/types';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current value, clamped to `0..max`. Ignored when `indeterminate`. */
  value?: number;
  /** Upper bound of the scale. */
  max?: number;
  /** Semantic tone — drives the fill color via the shared tone system. */
  tone?: Tone;
  /** Track thickness. */
  size?: 'sm' | 'md' | 'lg';
  /** Show a trailing label: `true` renders the rounded percent, a node is shown verbatim. */
  label?: boolean | React.ReactNode;
  /** Animate an indeterminate sweep instead of reflecting `value`. */
  indeterminate?: boolean;
}

/**
 * Linear progress bar. Pass a `value`/`max` for determinate progress, or
 * `indeterminate` for an animated activity sweep.
 *
 * @example
 * <Progress value={72} tone="success" label />
 * @category Feedback
 */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  {
    value = 0,
    max = 100,
    tone = 'brand',
    size = 'md',
    label = false,
    indeterminate = false,
    className,
    ...rest
  },
  ref,
) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const pct = (clamped / safeMax) * 100;

  const showLabel = label !== false && label != null;
  const labelNode = label === true ? `${Math.round(pct)}%` : label;

  return (
    <div
      ref={ref}
      data-us-tone={tone}
      className={cn('us-progress', `us-progress--${size}`, className)}
      {...rest}
    >
      <div
        className="us-progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={indeterminate ? undefined : clamped}
      >
        <div
          className="us-progress__fill"
          data-indeterminate={indeterminate || undefined}
          style={indeterminate ? undefined : { width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="us-progress__label">{labelNode}</span>}
    </div>
  );
});

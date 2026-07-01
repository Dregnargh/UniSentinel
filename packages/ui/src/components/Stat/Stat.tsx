import * as React from 'react';
import { cn } from '../../lib/cn';
import type { Tone } from '../../lib/types';

/** Direction of a stat's delta — drives the arrow glyph and default tone. */
export type StatDeltaDirection = 'up' | 'down' | 'flat';

/** Trend indicator shown beneath a stat's value. */
export interface StatDelta {
  /** Change to display, e.g. `"+12%"` or `"3 controls"`. */
  value: React.ReactNode;
  /** Arrow direction; also picks the default delta tone. */
  direction?: StatDeltaDirection;
}

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Short metric name, rendered as a muted uppercase caption. */
  label: React.ReactNode;
  /** The headline figure. */
  value: React.ReactNode;
  /** Optional trend pill beneath the value. */
  delta?: StatDelta;
  /** Override the delta tone (defaults from `delta.direction`). */
  deltaTone?: Tone;
  /** Decorative icon shown opposite the label. */
  icon?: React.ReactNode;
  /** Secondary context line below everything else. */
  hint?: React.ReactNode;
}

const directionTone: Record<StatDeltaDirection, Tone> = {
  up: 'success',
  down: 'danger',
  flat: 'neutral',
};

function DeltaArrow({ direction }: { direction: StatDeltaDirection }) {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className="us-stat__delta-arrow"
    >
      {direction === 'up' && <path d="M12 5 20 17H4z" />}
      {direction === 'down' && <path d="M12 19 4 7h16z" />}
      {direction === 'flat' && <rect x="5" y="10.5" width="14" height="3" rx="1.5" />}
    </svg>
  );
}

/**
 * Metric / KPI display — a labelled headline figure with an optional trend
 * pill, leading icon and supporting hint line.
 *
 * @example
 * <Stat
 *   label="Compliance score"
 *   value="98%"
 *   delta={{ value: '+4 pts', direction: 'up' }}
 *   hint="vs. last quarter"
 * />
 * @category Data
 */
export const Stat = React.forwardRef<HTMLDivElement, StatProps>(function Stat(
  { label, value, delta, deltaTone, icon, hint, className, ...rest },
  ref,
) {
  const direction = delta?.direction ?? 'flat';
  const resolvedTone = deltaTone ?? directionTone[direction];

  return (
    <div ref={ref} className={cn('us-stat', className)} {...rest}>
      <div className="us-stat__head">
        <span className="us-stat__label">{label}</span>
        {icon && <span className="us-stat__icon">{icon}</span>}
      </div>
      <div className="us-stat__value">{value}</div>
      {delta && (
        <span className="us-stat__delta" data-us-tone={resolvedTone}>
          <DeltaArrow direction={direction} />
          <span>{delta.value}</span>
        </span>
      )}
      {hint != null && <div className="us-stat__hint">{hint}</div>}
    </div>
  );
});

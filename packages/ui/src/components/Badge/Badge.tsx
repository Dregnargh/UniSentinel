import * as React from 'react';
import { cn } from '../../lib/cn';
import type { Tone } from '../../lib/types';

export type BadgeVariant = 'subtle' | 'solid' | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Semantic tone — drives the badge colors via the shared tone system. */
  tone?: Tone;
  /** Fill style: tinted (`subtle`), full-color (`solid`), or bordered (`outline`). */
  variant?: BadgeVariant;
  /** Badge size. */
  size?: 'sm' | 'md';
  /** Render a small leading status dot before the label. */
  dot?: boolean;
}

/**
 * Compact status pill for labels, counts, and compliance states. Pick a `tone`
 * for color and a `variant` for fill treatment.
 *
 * @example
 * <Badge tone="success" dot>Compliant</Badge>
 * @category Data
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = 'neutral', variant = 'subtle', size = 'md', dot = false, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      data-us-tone={tone}
      className={cn('us-badge', `us-badge--${variant}`, `us-badge--${size}`, className)}
      {...rest}
    >
      {dot && <span className="us-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
});

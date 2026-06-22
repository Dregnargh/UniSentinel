import * as React from 'react';
import { cn } from '../../lib/cn';
import type { Tone } from '../../lib/types';
import { XIcon } from '../../lib/icons';

/** Labeled chip, optionally removable. */
export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Semantic tone — drives the subtle/outline coloring. */
  tone?: Tone;
  /** Fill style: tinted (`subtle`) or bordered (`outline`). */
  variant?: 'subtle' | 'outline';
  /** Padding / font size. */
  size?: 'sm' | 'md';
  /** Icon rendered before the label. */
  leftIcon?: React.ReactNode;
  /** Render a trailing remove button and call this when it is clicked. */
  onRemove?: () => void;
}

/**
 * Compact chip for labels, filters and metadata. Reuses the shared tone
 * system; pass `onRemove` to render a dismiss affordance.
 *
 * @example
 * <Tag tone="success" leftIcon={<CheckIcon />} onRemove={() => remove(id)}>
 *   Encrypted
 * </Tag>
 * @category Data
 */
export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(function Tag(
  {
    tone = 'neutral',
    variant = 'subtle',
    size = 'md',
    leftIcon,
    onRemove,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <span
      ref={ref}
      data-us-tone={tone}
      className={cn('us-tag', `us-tag--${variant}`, `us-tag--${size}`, className)}
      {...rest}
    >
      {leftIcon && <span className="us-tag__icon">{leftIcon}</span>}
      {children != null && <span className="us-tag__label">{children}</span>}
      {onRemove && (
        <button
          type="button"
          className="us-tag__remove"
          onClick={onRemove}
          aria-label="Remove"
        >
          <XIcon size={12} />
        </button>
      )}
    </span>
  );
});

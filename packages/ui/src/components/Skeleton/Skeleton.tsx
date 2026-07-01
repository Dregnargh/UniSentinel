import * as React from 'react';
import { cn } from '../../lib/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape of the placeholder. */
  variant?: 'text' | 'rect' | 'circle';
  /** Explicit width — numbers are treated as pixels. */
  width?: number | string;
  /** Explicit height — numbers are treated as pixels. */
  height?: number | string;
  /** For `text`, render this many stacked bars (the last is shortened). */
  lines?: number;
  /** Override the corner radius — numbers are treated as pixels. */
  radius?: number | string;
}

/** Numbers become `px`; strings pass through untouched. */
function toLength(value: number | string | undefined): string | undefined {
  if (value == null) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

/**
 * Animated loading placeholder with a shimmer sweep. Use `variant="text"` with
 * `lines` for paragraph skeletons, or `rect` / `circle` for media and avatars.
 *
 * @example
 * <Skeleton variant="circle" width={40} height={40} />
 * <Skeleton variant="text" lines={3} />
 * @category Feedback
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton(
    { variant = 'text', width, height, lines = 1, radius, className, style, ...rest },
    ref,
  ) {
    const widthLen = toLength(width);
    const heightLen = toLength(height);
    const radiusLen = toLength(radius);

    if (variant === 'text' && lines > 1) {
      return (
        <div
          ref={ref}
          className={cn('us-skeleton-lines', className)}
          aria-hidden="true"
          data-loading=""
          style={style}
          {...rest}
        >
          {Array.from({ length: lines }, (_, i) => {
            const isLast = i === lines - 1;
            return (
              <span
                key={i}
                className="us-skeleton us-skeleton--text"
                style={{
                  width: isLast ? '60%' : widthLen,
                  height: heightLen,
                  borderRadius: radiusLen,
                }}
              />
            );
          })}
        </div>
      );
    }

    const isCircle = variant === 'circle';

    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        className={cn('us-skeleton', `us-skeleton--${variant}`, className)}
        aria-hidden="true"
        data-loading=""
        style={{
          width: widthLen,
          height: isCircle ? (heightLen ?? widthLen) : heightLen,
          borderRadius: radiusLen,
          ...style,
        }}
        {...(rest as React.HTMLAttributes<HTMLSpanElement>)}
      />
    );
  },
);

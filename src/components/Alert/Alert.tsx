import * as React from 'react';
import { cn } from '../../lib/cn';
import type { Tone } from '../../lib/types';
import {
  InfoIcon,
  CheckCircleIcon,
  WarningIcon,
  DangerIcon,
  ShieldIcon,
  XIcon,
} from '../../lib/icons';

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Semantic tone — drives color and the default leading icon. */
  tone?: Tone;
  /** Fill style: tinted (`subtle`) or full-color (`solid`). */
  variant?: 'subtle' | 'solid';
  /** Bold leading line above the body. */
  title?: React.ReactNode;
  /** Override the default tone icon, or pass `false` to hide it. */
  icon?: React.ReactNode | false;
  /** Render a dismiss button and call this when it is clicked. */
  onClose?: () => void;
}

const toneIcon: Record<Tone, React.ComponentType<{ size?: number }>> = {
  neutral: InfoIcon,
  brand: ShieldIcon,
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: WarningIcon,
  danger: DangerIcon,
};

/**
 * Inline contextual message — compliance status, audit findings, system
 * notices. Pick a `tone` for color + default icon.
 *
 * @example
 * <Alert tone="warning" title="Control drift detected">
 *   3 access reviews are overdue for SOC 2 CC6.1.
 * </Alert>
 * @category Feedback
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { tone = 'info', variant = 'subtle', title, icon, onClose, className, children, ...rest },
  ref,
) {
  const DefaultIcon = toneIcon[tone];
  const showIcon = icon !== false;
  return (
    <div
      ref={ref}
      role="alert"
      data-us-tone={tone}
      className={cn('us-alert', `us-alert--${variant}`, className)}
      {...rest}
    >
      {showIcon && (
        <span className="us-alert__icon">{icon ?? <DefaultIcon size={18} />}</span>
      )}
      <div className="us-alert__content">
        {title != null && <div className="us-alert__title">{title}</div>}
        {children != null && <div className="us-alert__body">{children}</div>}
      </div>
      {onClose && (
        <button type="button" className="us-alert__close" onClick={onClose} aria-label="Dismiss">
          <XIcon size={16} />
        </button>
      )}
    </div>
  );
});

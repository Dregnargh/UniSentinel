import * as React from 'react';
import { cn } from '../../lib/cn';

export interface TooltipProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'content'> {
  /** Tooltip body shown on hover / focus of the trigger. */
  content: React.ReactNode;
  /** Side of the trigger the tooltip is anchored to. */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Controlled visibility. When set, the internal hover/focus state is ignored. */
  open?: boolean;
  /** Initial visibility for the uncontrolled state (useful for static previews). */
  defaultOpen?: boolean;
  /** The trigger element the tooltip describes. */
  children: React.ReactNode;
}

/**
 * Lightweight hover / focus tooltip. Wraps a single trigger and reveals
 * `content` positioned on the chosen side. Controlled via `open`, or
 * uncontrolled with an optional `defaultOpen` starting state.
 *
 * @example
 * <Tooltip content="Last synced 4 minutes ago" placement="top">
 *   <Button variant="ghost" iconOnly><InfoIcon /></Button>
 * </Tooltip>
 * @category Feedback
 */
export const Tooltip = React.forwardRef<HTMLSpanElement, TooltipProps>(
  function Tooltip(
    { content, placement = 'top', open, defaultOpen = false, className, children, ...rest },
    ref,
  ) {
    const [visible, setVisible] = React.useState(defaultOpen);
    const shown = open !== undefined ? open : visible;

    const show = () => setVisible(true);
    const hide = () => setVisible(false);

    return (
      <span
        ref={ref}
        className={cn('us-tooltip-wrap', className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        {...rest}
      >
        {children}
        <span
          role="tooltip"
          className={cn('us-tooltip', `us-tooltip--${placement}`)}
          data-show={shown || undefined}
        >
          <span className="us-tooltip__content">{content}</span>
          <span className="us-tooltip__arrow" aria-hidden="true" />
        </span>
      </span>
    );
  },
);

import * as React from 'react';
import { cn } from '../../lib/cn';
import { ShieldIcon } from '../../lib/icons';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'rounded';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

/** User avatar with image, initials, or icon fallback. */
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Image source. Falls back to initials or icon if absent or it fails to load. */
  src?: string;
  /** Alt text for the image. */
  alt?: string;
  /** Display name used to derive initials when no image is available. */
  name?: string;
  /** Overall diameter. */
  size?: AvatarSize;
  /** Corner treatment: fully round or soft square. */
  shape?: AvatarShape;
  /** Presence indicator dot rendered at the bottom-right. */
  status?: AvatarStatus;
  /** Custom fallback icon, used when there is no image or name. */
  icon?: React.ReactNode;
}

/** Compute up to two uppercase initials from a display name. */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return words.map((w) => w[0]!.toUpperCase()).join('');
}

const AvatarBase = React.forwardRef<HTMLSpanElement, AvatarProps>(function AvatarRoot(
  { src, alt, name, size = 'md', shape = 'circle', status, icon, className, ...rest },
  ref,
) {
  const [errored, setErrored] = React.useState(false);
  const showImage = src != null && src !== '' && !errored;
  const initials = name ? getInitials(name) : '';

  return (
    <span
      ref={ref}
      className={cn('us-avatar', `us-avatar--${size}`, `us-avatar--${shape}`, className)}
      {...rest}
    >
      {showImage ? (
        <img
          className="us-avatar__img"
          src={src}
          alt={alt ?? name ?? ''}
          onError={() => setErrored(true)}
        />
      ) : initials ? (
        <span className="us-avatar__initials" aria-hidden="true">
          {initials}
        </span>
      ) : (
        <span className="us-avatar__icon" aria-hidden="true">
          {icon ?? <ShieldIcon />}
        </span>
      )}
      {status && (
        <span
          className={cn('us-avatar__status', `us-avatar__status--${status}`)}
          aria-hidden="true"
        />
      )}
    </span>
  );
});

/** Overlapping cluster of avatars with an optional overflow counter. */
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum number of avatars to render before collapsing into a +N counter. */
  max?: number;
  /** Size applied to every avatar in the group (overrides per-avatar size). */
  size?: AvatarProps['size'];
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(function AvatarGroup(
  { max, size = 'md', className, children, ...rest },
  ref,
) {
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const limit = max != null && max < items.length ? max : items.length;
  const visible = items.slice(0, limit);
  const overflow = items.length - visible.length;

  return (
    <div ref={ref} className={cn('us-avatar-group', className)} {...rest}>
      {visible.map((child) =>
        React.cloneElement(child as React.ReactElement<AvatarProps>, { size }),
      )}
      {overflow > 0 && (
        <span
          className={cn('us-avatar', `us-avatar--${size}`, 'us-avatar--circle', 'us-avatar-group__count')}
        >
          <span className="us-avatar__initials" aria-hidden="true">
            +{overflow}
          </span>
        </span>
      )}
    </div>
  );
});

interface AvatarComponent
  extends React.ForwardRefExoticComponent<AvatarProps & React.RefAttributes<HTMLSpanElement>> {
  Group: typeof AvatarGroup;
}

/**
 * Represents a user or entity. Renders the `src` image when available,
 * otherwise initials from `name`, otherwise the `icon` (defaults to a shield).
 * Compose stacks with `Avatar.Group`.
 *
 * @example
 * <Avatar name="Ada Lovelace" status="online" />
 * @category Data
 */
export const Avatar = Object.assign(AvatarBase, { Group: AvatarGroup }) as AvatarComponent;

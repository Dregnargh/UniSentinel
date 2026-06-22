import * as React from 'react';
import { cn } from '../../lib/cn';
import { ChevronRightIcon } from '../../lib/icons';

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  /** Node placed between each item. Defaults to a chevron. */
  separator?: React.ReactNode;
}

export interface BreadcrumbItemProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Mark the final, current-page crumb — renders plain text, not a link. */
  current?: boolean;
  /** Icon rendered before the label. */
  leftIcon?: React.ReactNode;
}

const BreadcrumbItem = React.forwardRef<HTMLAnchorElement, BreadcrumbItemProps>(
  function BreadcrumbItem({ current = false, leftIcon, className, children, ...rest }, ref) {
    const label = (
      <>
        {leftIcon && <span className="us-breadcrumb__icon">{leftIcon}</span>}
        {children}
      </>
    );

    if (current) {
      return (
        <span
          className={cn('us-breadcrumb__current', className)}
          aria-current="page"
        >
          {label}
        </span>
      );
    }

    return (
      <a ref={ref} className={cn('us-breadcrumb__link', className)} {...rest}>
        {label}
      </a>
    );
  },
);

interface BreadcrumbComponent
  extends React.ForwardRefExoticComponent<
    BreadcrumbProps & React.RefAttributes<HTMLElement>
  > {
  Item: typeof BreadcrumbItem;
}

const BreadcrumbBase = React.forwardRef<HTMLElement, BreadcrumbProps>(function BreadcrumbRoot(
  { separator, className, children, ...rest },
  ref,
) {
  const items = React.Children.toArray(children);
  return (
    <nav
      ref={ref}
      aria-label="Breadcrumb"
      className={cn('us-breadcrumb', className)}
      {...rest}
    >
      <ol className="us-breadcrumb__list">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <li className="us-breadcrumb__item">{item}</li>
            {index < items.length - 1 && (
              <li className="us-breadcrumb__sep" aria-hidden="true">
                {separator ?? <ChevronRightIcon size={14} />}
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
});

/**
 * Breadcrumb trail showing the path to the current page. Compose with
 * `Breadcrumb.Item`; mark the last item with `current`.
 *
 * @example
 * <Breadcrumb>
 *   <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
 *   <Breadcrumb.Item href="/frameworks">Frameworks</Breadcrumb.Item>
 *   <Breadcrumb.Item current>SOC 2</Breadcrumb.Item>
 * </Breadcrumb>
 * @category Navigation
 */
export const Breadcrumb = Object.assign(BreadcrumbBase, {
  Item: BreadcrumbItem,
}) as BreadcrumbComponent;

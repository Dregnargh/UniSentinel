import * as React from 'react';
import { cn } from '../../lib/cn';

export type CardVariant = 'elevated' | 'outlined' | 'subtle';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Surface treatment: shadowed, bordered, or muted fill. */
  variant?: CardVariant;
  /** Add hover lift + pointer cursor for clickable cards. */
  interactive?: boolean;
}

export interface CardSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Heading level / element to render. */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** Muted secondary line beneath the title. */
  subtitle?: React.ReactNode;
}

const CardBase = React.forwardRef<HTMLDivElement, CardProps>(function CardRoot(
  { variant = 'elevated', interactive = false, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('us-card', `us-card--${variant}`, { 'us-card--interactive': interactive }, className)}
      {...rest}
    />
  );
});

const CardHeader = React.forwardRef<HTMLDivElement, CardSectionProps>(function CardHeader(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cn('us-card__header', className)} {...rest} />;
});

const CardBody = React.forwardRef<HTMLDivElement, CardSectionProps>(function CardBody(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cn('us-card__body', className)} {...rest} />;
});

const CardFooter = React.forwardRef<HTMLDivElement, CardSectionProps>(function CardFooter(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cn('us-card__footer', className)} {...rest} />;
});

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(function CardTitle(
  { as: Tag = 'h3', subtitle, className, children, ...rest },
  ref,
) {
  return (
    <div className="us-card__title-group">
      <Tag ref={ref} className={cn('us-card__title', className)} {...rest}>
        {children}
      </Tag>
      {subtitle != null && <p className="us-card__subtitle">{subtitle}</p>}
    </div>
  );
});

interface CardComponent
  extends React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>> {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
  Title: typeof CardTitle;
}

/**
 * Content container with composable sections: `Card.Header`, `Card.Body`,
 * `Card.Footer` and `Card.Title`.
 *
 * @example
 * <Card>
 *   <Card.Header><Card.Title subtitle="ISO 27001">Access Control</Card.Title></Card.Header>
 *   <Card.Body>12 of 14 controls effective.</Card.Body>
 * </Card>
 * @category Layout
 */
export const Card = Object.assign(CardBase, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
  Title: CardTitle,
}) as CardComponent;

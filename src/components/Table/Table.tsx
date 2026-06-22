import * as React from 'react';
import { cn } from '../../lib/cn';
import type { Size } from '../../lib/types';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /** Cell padding / font size for the whole table. */
  size?: Size;
  /** Zebra-stripe alternating body rows. */
  striped?: boolean;
  /** Highlight body rows on hover. */
  hoverable?: boolean;
  /** Pin the header row to the top while the body scrolls. */
  stickyHeader?: boolean;
}

export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /** Horizontal text alignment within the cell. */
  align?: 'left' | 'center' | 'right';
}

export interface TableHeaderCellProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Horizontal text alignment within the header cell. */
  align?: 'left' | 'center' | 'right';
}

const TableBase = React.forwardRef<HTMLTableElement, TableProps>(function TableRoot(
  {
    size = 'md',
    striped = false,
    hoverable = false,
    stickyHeader = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <div className="us-table-scroll">
      <table
        ref={ref}
        className={cn('us-table', `us-table--${size}`, className)}
        data-striped={striped || undefined}
        data-hoverable={hoverable || undefined}
        data-sticky={stickyHeader || undefined}
        {...rest}
      >
        {children}
      </table>
    </div>
  );
});

const TableHead = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(function TableHead({ className, ...rest }, ref) {
  return <thead ref={ref} className={cn('us-table__head', className)} {...rest} />;
});

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(function TableBody({ className, ...rest }, ref) {
  return <tbody ref={ref} className={cn('us-table__body', className)} {...rest} />;
});

const TableFoot = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(function TableFoot({ className, ...rest }, ref) {
  return <tfoot ref={ref} className={cn('us-table__foot', className)} {...rest} />;
});

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(function TableRow({ className, ...rest }, ref) {
  return <tr ref={ref} className={cn('us-table__row', className)} {...rest} />;
});

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  function TableCell({ align, className, style, ...rest }, ref) {
    return (
      <td
        ref={ref}
        className={cn('us-table__cell', className)}
        style={align ? { textAlign: align, ...style } : style}
        {...rest}
      />
    );
  },
);

const TableHeaderCell = React.forwardRef<HTMLTableCellElement, TableHeaderCellProps>(
  function TableHeaderCell({ align, className, style, scope = 'col', ...rest }, ref) {
    return (
      <th
        ref={ref}
        scope={scope}
        className={cn('us-table__th', className)}
        style={align ? { textAlign: align, ...style } : style}
        {...rest}
      />
    );
  },
);

interface TableComponent
  extends React.ForwardRefExoticComponent<
    TableProps & React.RefAttributes<HTMLTableElement>
  > {
  Head: typeof TableHead;
  Body: typeof TableBody;
  Foot: typeof TableFoot;
  Row: typeof TableRow;
  Cell: typeof TableCell;
  HeaderCell: typeof TableHeaderCell;
}

/**
 * Semantic data table with composable parts: `Table.Head`, `Table.Body`,
 * `Table.Foot`, `Table.Row`, `Table.HeaderCell` and `Table.Cell`. The table is
 * wrapped in a horizontally scrollable, bordered container.
 *
 * @example
 * <Table striped hoverable>
 *   <Table.Head>
 *     <Table.Row>
 *       <Table.HeaderCell>Control</Table.HeaderCell>
 *       <Table.HeaderCell align="right">Score</Table.HeaderCell>
 *     </Table.Row>
 *   </Table.Head>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Cell>CC6.1</Table.Cell>
 *       <Table.Cell align="right">98%</Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table>
 * @category Data
 */
export const Table = Object.assign(TableBase, {
  Head: TableHead,
  Body: TableBody,
  Foot: TableFoot,
  Row: TableRow,
  Cell: TableCell,
  HeaderCell: TableHeaderCell,
}) as TableComponent;

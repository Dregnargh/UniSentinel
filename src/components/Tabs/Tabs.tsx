import * as React from 'react';
import { cn } from '../../lib/cn';
import type { Size } from '../../lib/types';

export type TabsVariant = 'line' | 'soft';

/** Root tab container. */
export interface TabsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Controlled active tab value. */
  value?: string;
  /** Uncontrolled initial active tab value. */
  defaultValue?: string;
  /** Called with the new value whenever the active tab changes. */
  onChange?: (value: string) => void;
  /** Visual style: underlined (`line`) or pill (`soft`). */
  variant?: TabsVariant;
  /** Control height / padding / font size. */
  size?: Size;
  /** Stretch tabs to fill the list width in equal columns. */
  fitted?: boolean;
}

/** The horizontal strip that contains the tab buttons. */
export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

/** A single tab trigger. */
export interface TabProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  /** Identifier that ties this tab to its panel. */
  value: string;
  /** Icon rendered before the label. */
  leftIcon?: React.ReactNode;
}

/** The content region associated with a tab `value`. */
export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Identifier of the tab that reveals this panel. */
  value: string;
}

interface TabsContextValue {
  value: string | undefined;
  setValue: (value: string) => void;
  variant: TabsVariant;
  size: Size;
  baseId: string;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error(`${component} must be used within <Tabs>`);
  }
  return ctx;
}

const TabsBase = React.forwardRef<HTMLDivElement, TabsProps>(function TabsRoot(
  {
    value,
    defaultValue,
    onChange,
    variant = 'line',
    size = 'md',
    fitted = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  const isControlled = value != null;
  const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue);
  const baseId = React.useId();

  const currentValue = isControlled ? value : internalValue;

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) {
        setInternalValue(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  const ctx = React.useMemo<TabsContextValue>(
    () => ({ value: currentValue, setValue, variant, size, baseId }),
    [currentValue, setValue, variant, size, baseId],
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div
        ref={ref}
        className={cn('us-tabs', `us-tabs--${variant}`, `us-tabs--${size}`, className)}
        data-fitted={fitted || undefined}
        {...rest}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
});

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { className, children, ...rest },
  ref,
) {
  const { variant } = useTabsContext('Tabs.List');
  return (
    <div
      ref={ref}
      role="tablist"
      className={cn('us-tabs__list', `us-tabs__list--${variant}`, className)}
      {...rest}
    >
      {children}
    </div>
  );
});

const Tab = React.forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { value, leftIcon, className, children, onClick, disabled, ...rest },
  ref,
) {
  const ctx = useTabsContext('Tabs.Tab');
  const active = ctx.value === value;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) {
      ctx.setValue(value);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={`${ctx.baseId}-tab-${value}`}
      aria-controls={`${ctx.baseId}-panel-${value}`}
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      data-active={active || undefined}
      disabled={disabled}
      className={cn('us-tabs__tab', className)}
      onClick={handleClick}
      {...rest}
    >
      {leftIcon && <span className="us-tabs__tab-icon">{leftIcon}</span>}
      {children != null && <span className="us-tabs__tab-label">{children}</span>}
    </button>
  );
});

const TabPanel = React.forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(
  { value, className, children, ...rest },
  ref,
) {
  const ctx = useTabsContext('Tabs.Panel');
  const active = ctx.value === value;
  if (!active) return null;

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={`${ctx.baseId}-panel-${value}`}
      aria-labelledby={`${ctx.baseId}-tab-${value}`}
      hidden={!active}
      className={cn('us-tabs__panel', className)}
      {...rest}
    >
      {children}
    </div>
  );
});

interface TabsComponent
  extends React.ForwardRefExoticComponent<TabsProps & React.RefAttributes<HTMLDivElement>> {
  List: typeof TabsList;
  Tab: typeof Tab;
  Panel: typeof TabPanel;
}

/**
 * Tabbed navigation with `Tabs.List`, `Tabs.Tab` and `Tabs.Panel`. Works
 * controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 *
 * @example
 * <Tabs defaultValue="overview">
 *   <Tabs.List>
 *     <Tabs.Tab value="overview">Overview</Tabs.Tab>
 *     <Tabs.Tab value="findings">Findings</Tabs.Tab>
 *   </Tabs.List>
 *   <Tabs.Panel value="overview">…</Tabs.Panel>
 *   <Tabs.Panel value="findings">…</Tabs.Panel>
 * </Tabs>
 * @category Navigation
 */
export const Tabs = Object.assign(TabsBase, {
  List: TabsList,
  Tab: Tab,
  Panel: TabPanel,
}) as TabsComponent;

import * as React from 'react';
import { cn } from '../../lib/cn';
import type { Size } from '../../lib/types';

/** Internal shape shared from RadioGroup down to each RadioGroup.Option. */
interface RadioGroupContextValue {
  /** Shared `name` for every radio in the group. */
  name: string;
  /** Currently selected option value (controlled or internal). */
  value: string | undefined;
  /** Select the option with the given value. */
  onChange: (value: string) => void;
  /** Control size applied to each option. */
  size: Size;
  /** Disable every option in the group. */
  disabled: boolean;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

function useRadioGroupContext(): RadioGroupContextValue {
  const ctx = React.useContext(RadioGroupContext);
  if (!ctx) {
    throw new Error('RadioGroup.Option must be rendered inside a <RadioGroup>.');
  }
  return ctx;
}

export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Shared `name` for the underlying radio inputs. Auto-generated when omitted. */
  name?: string;
  /** Selected value (controlled). */
  value?: string;
  /** Initial selected value (uncontrolled). */
  defaultValue?: string;
  /** Called with the newly selected value when the selection changes. */
  onChange?: (value: string) => void;
  /** Lay options out in a column (`vertical`) or row (`horizontal`). */
  orientation?: 'vertical' | 'horizontal';
  /** Control size applied to every option. */
  size?: Size;
  /** Disable every option in the group. */
  disabled?: boolean;
}

export interface RadioOptionProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'size' | 'type' | 'value' | 'onChange'
  > {
  /** Value submitted / reported when this option is selected. */
  value: string;
  /** Primary label rendered beside the control. */
  label?: React.ReactNode;
  /** Secondary helper text rendered beneath the label. */
  description?: React.ReactNode;
}

const RadioOption = React.forwardRef<HTMLInputElement, RadioOptionProps>(function RadioOption(
  { value, label, description, className, disabled, ...rest },
  ref,
) {
  const ctx = useRadioGroupContext();
  const isDisabled = ctx.disabled || disabled || false;
  const checked = ctx.value === value;
  return (
    <label
      className={cn('us-radio', `us-radio--${ctx.size}`, className)}
      data-disabled={isDisabled || undefined}
    >
      <input
        ref={ref}
        type="radio"
        className="us-radio__control us-visually-hidden"
        name={ctx.name}
        value={value}
        checked={checked}
        onChange={() => ctx.onChange(value)}
        disabled={isDisabled}
        {...rest}
      />
      <span className="us-radio__dot" aria-hidden="true" />
      {(label != null || description != null) && (
        <span className="us-radio__text">
          {label != null && <span className="us-radio__label">{label}</span>}
          {description != null && (
            <span className="us-radio__description">{description}</span>
          )}
        </span>
      )}
    </label>
  );
});

interface RadioGroupComponent
  extends React.ForwardRefExoticComponent<
    RadioGroupProps & React.RefAttributes<HTMLDivElement>
  > {
  Option: typeof RadioOption;
}

const RadioGroupBase = React.forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroupRoot(
  {
    name,
    value,
    defaultValue,
    onChange,
    orientation = 'vertical',
    size = 'md',
    disabled = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  const fallbackName = React.useId();
  const isControlled = value != null;
  const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue);
  const selected = isControlled ? value : internalValue;

  const handleChange = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  const ctx = React.useMemo<RadioGroupContextValue>(
    () => ({
      name: name ?? fallbackName,
      value: selected,
      onChange: handleChange,
      size,
      disabled,
    }),
    [name, fallbackName, selected, handleChange, size, disabled],
  );

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-orientation={orientation}
      className={cn('us-radio-group', `us-radio-group--${orientation}`, className)}
      {...rest}
    >
      <RadioGroupContext.Provider value={ctx}>{children}</RadioGroupContext.Provider>
    </div>
  );
});

/**
 * Single-select group of radio controls sharing one `name`. Compose with
 * `RadioGroup.Option`. Controlled via `value` + `onChange`, or uncontrolled
 * via `defaultValue`.
 *
 * @example
 * <RadioGroup defaultValue="quarterly" onChange={setCadence}>
 *   <RadioGroup.Option value="quarterly" label="Quarterly" description="Every 90 days" />
 *   <RadioGroup.Option value="annual" label="Annual" />
 * </RadioGroup>
 * @category Forms
 */
export const RadioGroup = Object.assign(RadioGroupBase, {
  Option: RadioOption,
}) as RadioGroupComponent;

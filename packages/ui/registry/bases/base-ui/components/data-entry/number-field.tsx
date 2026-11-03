import * as React from 'react';

import { InputGroup, InputGroupInput } from '@/registry/bases/base-ui/ui/input-group';
import { evaluateExpression } from '@/registry/bases/base-ui/lib/expr-eval';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface NumberFieldProps extends Omit<React.ComponentProps<typeof InputGroup>, 'onChange' | 'defaultValue'> {
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  /** Increment/decrement applied on ArrowUp / ArrowDown (clamped to min/max).
   *  Omit to leave the arrows as native text-cursor movement. */
  step?: number;
  /** Override raw parsing - receives the draft string, returns a number or null. */
  parseRaw?: (raw: string) => number | null;
  /**
   * Multi-selection with differing values - blanks the value and shows the
   * input's `placeholder` until the user types one, which then applies to every
   * selected target.
   */
  mixed?: boolean;
  /**
   * Show this text in place of the numeric value while not editing (e.g. a
   * "Hug" / "Fill" sizing label). Focusing clears it so typing commits a number.
   */
  displayText?: string;
}

interface NumberFieldContextValue {
  /** What the input shows: the draft while editing, else the value or `displayText`. */
  text: string;
  /** Whether the input shows its `placeholder`: only while mixed and not editing. */
  placeholderShown: boolean;
  disabled: boolean | undefined;
  begin: () => void;
  change: (raw: string) => void;
  commit: () => void;
  keyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

const NumberFieldContext = React.createContext<NumberFieldContextValue | null>(null);

function useNumberField(): NumberFieldContextValue {
  const context = React.useContext(NumberFieldContext);
  if (!context) throw new Error('NumberFieldInput must be used within <NumberField>');
  return context;
}

/**
 * A compact numeric field for a property inspector, over upstream's
 * `InputGroup`. The root parses (arithmetic expressions, or `parseRaw`), clamps
 * to `min`/`max` and steps on the arrow keys; the consumer composes a
 * `NumberFieldInput` and any `InputGroupAddon` / `InputGroupText` around it (a
 * label before, a unit or a trigger after). Controlled - the consumer owns the
 * number. The root carries `data-mixed` while `mixed`, `data-editing` while
 * the input holds a draft, and `data-disabled` while `disabled`.
 * `NumberFieldInput` sets its own `data-slot="number-field-input"`, and the
 * root's focus ring reads that slot in place of upstream's
 * `input-group-control`.
 */
function NumberField({
  value,
  onValueChange,
  disabled,
  min,
  max,
  step,
  parseRaw,
  mixed,
  displayText,
  className,
  children,
  ...props
}: NumberFieldProps): React.ReactNode {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  // Escape blurs the input to end the edit; this tells the blur's commit that the draft was dropped.
  const cancelled = React.useRef(false);

  const clamp = React.useCallback(
    (next: number) => {
      let clamped = next;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      return clamped;
    },
    [min, max],
  );

  const begin = React.useCallback(() => {
    cancelled.current = false;
    setEditing(true);
    setDraft(mixed || displayText ? '' : String(value));
  }, [value, mixed, displayText]);

  const change = React.useCallback(
    (raw: string) => {
      if (editing) setDraft(raw);
      else onValueChange(Number(raw));
    },
    [editing, onValueChange],
  );

  const commit = React.useCallback(() => {
    setEditing(false);
    if (cancelled.current) return;
    const result = parseRaw ? parseRaw(draft) : evaluateExpression(draft);
    if (result !== null) onValueChange(clamp(result));
  }, [draft, parseRaw, onValueChange, clamp]);

  const keyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.currentTarget.blur();
      } else if (event.key === 'Escape') {
        cancelled.current = true;
        setEditing(false);
        event.currentTarget.blur();
      } else if (step !== undefined && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        // Step the value (the arrows are inert otherwise - a text cursor in a
        // single-line field has nowhere to go vertically).
        event.preventDefault();
        const base = editing ? (evaluateExpression(draft) ?? value) : value;
        const next = clamp(base + (event.key === 'ArrowUp' ? step : -step));
        onValueChange(next);
        if (editing) setDraft(String(next));
      }
    },
    [value, step, editing, draft, onValueChange, clamp],
  );

  const text = editing ? draft : mixed ? '' : (displayText ?? String(value));
  const context = React.useMemo<NumberFieldContextValue>(
    () => ({ text, placeholderShown: Boolean(mixed) && !editing, disabled, begin, change, commit, keyDown }),
    [text, mixed, editing, disabled, begin, change, commit, keyDown],
  );

  return (
    <NumberFieldContext.Provider value={context}>
      <InputGroup
        data-slot="number-field"
        data-mixed={mixed || undefined}
        data-editing={editing || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          'has-[[data-slot=number-field-input]:focus-visible]:border-ring has-[[data-slot=number-field-input]:focus-visible]:ring-ring/50 has-[[data-slot=number-field-input]:focus-visible]:ring-3',
          className,
        )}
        {...props}
      >
        {children}
      </InputGroup>
    </NumberFieldContext.Provider>
  );
}

type NumberFieldInputProps = Omit<
  React.ComponentProps<typeof InputGroupInput>,
  'value' | 'defaultValue' | 'type' | 'disabled'
>;

/**
 * The value input of a `NumberField`. It shows the field's value (or its draft
 * while focused) and hands every edit to the root; its `placeholder` shows only
 * while the field is `mixed`. It sets its own `data-slot="number-field-input"`;
 * the root's focus ring reads that slot in place of upstream's
 * `input-group-control`.
 */
function NumberFieldInput({
  placeholder,
  className,
  onFocus,
  onChange,
  onBlur,
  onKeyDown,
  ...props
}: NumberFieldInputProps): React.ReactNode {
  const field = useNumberField();
  return (
    <InputGroupInput
      data-slot="number-field-input"
      type="text"
      inputMode="decimal"
      value={field.text}
      placeholder={field.placeholderShown ? placeholder : undefined}
      disabled={field.disabled}
      className={cn('tabular-nums', className)}
      onFocus={(event) => {
        onFocus?.(event);
        field.begin();
      }}
      onChange={(event) => {
        onChange?.(event);
        field.change(event.target.value);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        field.commit();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) field.keyDown(event);
      }}
      {...props}
    />
  );
}

export { NumberField, NumberFieldInput };
export type { NumberFieldProps, NumberFieldInputProps };

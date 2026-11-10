import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import type { TextInputInstance, TextInputKeyPressEvent } from 'react-native';
import { evaluateExpression } from '../../lib/expr-eval';
import { cn } from '../../lib/utils';
import { InputGroup, InputGroupInput, type InputGroupInputProps } from '../../ui/input-group';

type NumberFieldProps = Omit<ComponentProps<typeof InputGroup>, 'defaultValue'> & {
  value: number;
  onValueChange: (value: number) => void;
  /** Makes the input not editable, announced as disabled. */
  disabled?: boolean;
  min?: number;
  max?: number;
  /**
   * Added or taken away on ArrowUp / ArrowDown, clamped to min/max. Only a hardware keyboard and the web report
   * those keys, so on a touch keyboard it has no trigger; omit it to leave the arrows to the text cursor.
   */
  step?: number;
  /** Parses the draft in place of arithmetic; returns a number, or null to commit nothing. */
  parseRaw?: (raw: string) => number | null;
  /**
   * Multi-selection with differing values: blanks the value and shows the input's `placeholder` until a value
   * is typed, which then applies to every selected target.
   */
  mixed?: boolean;
  /**
   * Shown in place of the number while not editing, such as a "Hug" or "Fill" sizing label. Focusing clears it
   * so typing commits a number.
   */
  displayText?: string;
};

/** Where the edit begun on focus stands, which the commit on blur reads. */
type EditSession = 'idle' | 'editing' | 'cancelled';

interface NumberFieldContextValue {
  /** What the input shows: the draft while editing, else the value or `displayText`. */
  text: string;
  /** Whether the input shows its `placeholder`: only while mixed and not editing. */
  placeholderShown: boolean;
  disabled: boolean | undefined;
  begin: () => void;
  change: (raw: string) => void;
  commit: () => void;
  /** Handles Escape and the arrows; `blur` ends the edit the way leaving the field does. */
  keyPress: (event: TextInputKeyPressEvent, blur: () => void) => void;
}

const NumberFieldContext = createContext<NumberFieldContextValue | null>(null);

function useNumberField(): NumberFieldContextValue {
  const context = useContext(NumberFieldContext);
  if (!context) throw new Error('NumberFieldInput must be used within <NumberField>');
  return context;
}

/**
 * A compact numeric field for a property inspector, over InputGroup. The root parses the draft (arithmetic such
 * as `100 + 8`, or `parseRaw`), clamps it to `min`/`max` and commits it on the return key or on leaving the
 * field; Escape drops the draft and the arrows step by `step`, where the keyboard reports those keys. The caller
 * composes a NumberFieldInput and any InputGroupAddon around it:
 *
 *   <NumberField value={width} onValueChange={setWidth} min={0} max={1000}>
 *     <InputGroupAddon>
 *       <InputGroupText>W</InputGroupText>
 *     </InputGroupAddon>
 *     <NumberFieldInput aria-label="Width" />
 *   </NumberField>
 *
 * Controlled: the caller owns the number. Takes every prop of InputGroup, whose focus, invalid and disabled
 * borders it draws.
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
  children,
  ...props
}: NumberFieldProps): ReactNode {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  // The return key commits and then blurs, and the blur commits again unless the session says it has ended.
  const session = useRef<EditSession>('idle');

  const clamp = useCallback(
    (next: number) => {
      let clamped = next;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      return clamped;
    },
    [min, max],
  );

  const begin = useCallback(() => {
    session.current = 'editing';
    setEditing(true);
    setDraft(mixed || displayText ? '' : String(value));
  }, [value, mixed, displayText]);

  const change = useCallback(
    (raw: string) => {
      if (editing) setDraft(raw);
      else onValueChange(Number(raw));
    },
    [editing, onValueChange],
  );

  const commit = useCallback(() => {
    setEditing(false);
    if (session.current !== 'editing') return;
    session.current = 'idle';
    const result = parseRaw ? parseRaw(draft) : evaluateExpression(draft);
    if (result !== null) onValueChange(clamp(result));
  }, [draft, parseRaw, onValueChange, clamp]);

  const keyPress = useCallback(
    (event: TextInputKeyPressEvent, blur: () => void) => {
      const { key } = event.nativeEvent;
      if (key === 'Escape') {
        session.current = 'cancelled';
        setEditing(false);
        blur();
      } else if (step !== undefined && (key === 'ArrowUp' || key === 'ArrowDown')) {
        // In React Native for Web this keeps the browser from moving the cursor to the start or end.
        event.preventDefault();
        const base = editing ? (evaluateExpression(draft) ?? value) : value;
        const next = clamp(base + (key === 'ArrowUp' ? step : -step));
        onValueChange(next);
        if (editing) setDraft(String(next));
      }
    },
    [value, step, editing, draft, onValueChange, clamp],
  );

  const text = editing ? draft : mixed ? '' : (displayText ?? String(value));
  const context = useMemo<NumberFieldContextValue>(
    () => ({ text, placeholderShown: Boolean(mixed) && !editing, disabled, begin, change, commit, keyPress }),
    [text, mixed, editing, disabled, begin, change, commit, keyPress],
  );

  return (
    <NumberFieldContext.Provider value={context}>
      <InputGroup {...props}>{children}</InputGroup>
    </NumberFieldContext.Provider>
  );
}

type NumberFieldInputProps = Omit<InputGroupInputProps, 'value' | 'defaultValue' | 'editable'>;

/**
 * The value input of a NumberField. It shows the field's value, or its draft while focused, and hands every edit
 * to the root; its `placeholder` shows only while the field is `mixed`. It opens iOS's numbers-and-punctuation
 * keyboard, since the decimal pad has no minus sign and no operators. Name it with `aria-label`.
 * @throws {Error} when rendered outside a NumberField
 */
function NumberFieldInput({
  placeholder,
  className,
  ref,
  onFocus,
  onChangeText,
  onBlur,
  onSubmitEditing,
  onKeyPress,
  ...props
}: NumberFieldInputProps): ReactNode {
  const field = useNumberField();
  const input = useRef<TextInputInstance | null>(null);
  const attach = useCallback(
    (node: TextInputInstance | null) => {
      input.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const blur = (): void => input.current?.blur();

  return (
    <InputGroupInput
      ref={attach}
      keyboardType="numbers-and-punctuation"
      value={field.text}
      placeholder={field.placeholderShown ? placeholder : undefined}
      editable={field.disabled ? false : undefined}
      className={cn('tabular-nums', className)}
      onFocus={(event) => {
        onFocus?.(event);
        field.begin();
      }}
      onChangeText={(text) => {
        onChangeText?.(text);
        field.change(text);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        field.commit();
      }}
      onSubmitEditing={(event) => {
        onSubmitEditing?.(event);
        field.commit();
        blur();
      }}
      onKeyPress={(event) => {
        onKeyPress?.(event);
        if (!event.isDefaultPrevented()) field.keyPress(event, blur);
      }}
      {...props}
    />
  );
}

export { NumberField, NumberFieldInput };
export type { NumberFieldProps, NumberFieldInputProps };

import { Minus } from 'lucide-react-native';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { cn } from '../lib/utils';
import { Icon, IconClassContext } from './icon';
import { Text } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes,
// `cn-<slot>/icon` for the size it gives an icon, and `cn-<slot>@<state>` for the classes behind that
// state, such as `@selected` for the slot the next character goes in; the registry build replaces each
// with the classes translated for the target engine.

/** A code of digits only, the default `pattern`. */
const REGEXP_ONLY_DIGITS = '^\\d+$';
/** A code of letters only. */
const REGEXP_ONLY_CHARS = '^[a-zA-Z]+$';
/** A code of digits and letters. */
const REGEXP_ONLY_DIGITS_AND_CHARS = '^[a-zA-Z0-9]+$';

/** What one slot shows. */
interface InputOTPSlotState {
  char: string | undefined;
  /** The slot the next character goes in, or the last slot once the code is full, while the code holds focus. */
  active: boolean;
}

/** What the parts of an InputOTP read from it. */
const InputOTPContext = createContext<{ slots: readonly InputOTPSlotState[]; invalid: boolean }>({
  slots: [],
  invalid: false,
});

/**
 * Whether a slot is its group's first or last child, which the group rounds and closes on the
 * outside; neither engine gives a child a reliable first or last state of its own. A slot outside a
 * group is both.
 */
const InputOTPSlotPositionContext = createContext<{ first: boolean; last: boolean }>({ first: true, last: true });

/** Removes the spaces and dashes a code is often shown with, from a paste or an autofill. */
function withoutSeparators(pasted: string): string {
  return pasted.replace(/[\s-]/g, '');
}

/** The name a screen reader reads for the field, as `aria-label` or `accessibilityLabel`; one of them is required. */
type InputOTPLabelProps =
  | { 'aria-label': string; accessibilityLabel?: string }
  | { accessibilityLabel: string; 'aria-label'?: string };

type InputOTPFieldProps = Omit<
  ComponentProps<typeof TextInput>,
  'value' | 'defaultValue' | 'onChange' | 'onChangeText' | 'maxLength' | 'children'
> & {
  /** The code's length, and the number of InputOTPSlot children, indexed from 0. */
  maxLength: number;
  /** The code, for a controlled field; leave it out and give `defaultValue` to let the field hold it. */
  value?: string;
  defaultValue?: string;
  /** Called with the code after each change the pattern accepts. */
  onChange?: (value: string) => void;
  /** Called with the code once it is `maxLength` characters long. */
  onComplete?: (value: string) => void;
  /**
   * What the whole code must match for a change to be taken, such as {@link REGEXP_ONLY_DIGITS_AND_CHARS};
   * defaults to {@link REGEXP_ONLY_DIGITS}. A change that does not match is refused.
   */
  pattern?: string | RegExp;
  /** Turns a pasted or autofilled text into the code; defaults to removing spaces and dashes. */
  pasteTransformer?: (pasted: string) => string;
  /** Classes of the row that holds the groups. */
  containerClassName?: string;
  /**
   * Draws every slot with the destructive border. React Native does not announce it, so carry the
   * error in `accessibilityHint` or in a Text the user can reach.
   */
  'aria-invalid'?: boolean;
  /** InputOTPGroups of InputOTPSlots, with InputOTPSeparators between them. */
  children: ReactNode;
};

type InputOTPProps = InputOTPFieldProps & InputOTPLabelProps;

/**
 * A one-time code entered in a row of slots, one character each. One text field, hidden under the
 * slots, takes the keystrokes, a paste and the code the OS offers from a text message, so the code
 * is one field to a screen reader, and the slots are hidden from it. The field is named with
 * `aria-label` or `accessibilityLabel`, and one of them is required. It opens the number pad unless
 * given another `keyboardType`. `editable={false}` dims it and announces it disabled. A `style` goes
 * to the hidden field, under what hides it.
 */
function InputOTP({
  maxLength,
  value: controlledValue,
  defaultValue = '',
  onChange,
  onComplete,
  pattern = REGEXP_ONLY_DIGITS,
  pasteTransformer = withoutSeparators,
  containerClassName,
  editable,
  'aria-invalid': invalid,
  onFocus,
  onBlur,
  style,
  children,
  ...props
}: InputOTPProps): ReactNode {
  const [heldValue, setHeldValue] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const value = controlledValue ?? heldValue;
  const disabled = editable === false;

  const slots = Array.from({ length: maxLength }, (_, index) => ({
    char: value[index],
    active: focused && index === Math.min(value.length, maxLength - 1),
  }));

  // The caret is kept at the end of the code, so the OS reports a paste as the old code followed by the
  // pasted text, and an autofill as the whole text; either way the pasted characters become the code.
  const pastedCode = (text: string): string => {
    const pasted = pasteTransformer(text.startsWith(value) ? text.slice(value.length) : text);
    const accepts = new RegExp(pattern);
    return Array.from(pasted)
      .filter((char) => accepts.test(char))
      .join('');
  };

  const change = (text: string): void => {
    const next = (text.length > value.length + 1 ? pastedCode(text) : text).slice(0, maxLength);
    if (next === value || (next.length > 0 && !new RegExp(pattern).test(next))) return;
    if (controlledValue === undefined) setHeldValue(next);
    onChange?.(next);
    if (next.length === maxLength) onComplete?.(next);
  };

  return (
    <InputOTPContext.Provider value={{ slots, invalid: invalid === true }}>
      <View className={cn('flex-row items-center cn-input-otp', disabled && 'opacity-50', containerClassName)}>
        {children}
        {/* No maxLength here: the OS would cut a pasted code shown with spaces before they are removed. */}
        <TextInput
          style={[style, styles.field]}
          value={value}
          onChangeText={change}
          selection={{ start: value.length, end: value.length }}
          caretHidden
          underlineColorAndroid="transparent"
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          editable={editable}
          aria-invalid={invalid}
          aria-disabled={disabled || undefined}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
      </View>
    </InputOTPContext.Provider>
  );
}

const styles = StyleSheet.create({
  field: {
    ...StyleSheet.absoluteFill,
    color: 'transparent',
    // At opacity 0, iOS offers no paste on the field and Android reports it not visible to the user, so
    // TalkBack cannot focus it and SMS autofill never fills it. It stays just visible, its text transparent.
    opacity: 0.02,
  },
});

/**
 * A run of InputOTPSlots drawn joined, rounded on the outside. The slots are its direct children,
 * since it finds its first and last slot among them.
 */
function InputOTPGroup({ className, children, ...props }: ComponentProps<typeof View>): ReactNode {
  const { invalid } = useContext(InputOTPContext);
  const slots = Children.toArray(children).filter(isValidElement);

  return (
    <View
      aria-hidden
      className={cn('flex-row items-center cn-input-otp-group', invalid && 'cn-input-otp-group@invalid', className)}
      {...props}
    >
      {slots.map((slot, index) => (
        <InputOTPSlotPositionContext.Provider
          key={slot.key}
          value={{ first: index === 0, last: index === slots.length - 1 }}
        >
          {slot}
        </InputOTPSlotPositionContext.Provider>
      ))}
    </View>
  );
}

type InputOTPSlotProps = ComponentProps<typeof View> & {
  /** Which character of the code the slot shows, from 0. */
  index: number;
  /** Draws this slot with the destructive border, as the code's `aria-invalid` draws every slot. */
  'aria-invalid'?: boolean;
  /** Classes of the character, merged after the style's text classes so they win. */
  textClassName?: string;
};

/**
 * One character of the code, with the focus border and a caret while it is the slot the next
 * character goes in.
 */
function InputOTPSlot({
  className,
  index,
  textClassName,
  'aria-invalid': ownInvalid,
  ...props
}: InputOTPSlotProps): ReactNode {
  const otp = useContext(InputOTPContext);
  const { first, last } = useContext(InputOTPSlotPositionContext);
  const { char, active } = otp.slots[index] ?? { char: undefined, active: false };
  const invalid = ownInvalid ?? otp.invalid;

  return (
    <View
      className={cn(
        'relative items-center justify-center cn-input-otp-slot',
        active && 'z-10 cn-input-otp-slot@selected',
        // The web draws the active slot's ring all round; here its own left edge stands in for the
        // part of the ring the slot before it covers, inside the same width.
        active && !first && 'border-l',
        invalid && 'cn-input-otp-slot@invalid',
        active && invalid && 'cn-input-otp-slot@invalid+selected',
        first && 'cn-input-otp-slot@position=first',
        last && 'cn-input-otp-slot@position=last',
        className,
      )}
      {...props}
    >
      {char === undefined ? null : <Text className={cn('cn-input-otp-slot/text', textClassName)}>{char}</Text>}
      {active && char === undefined ? (
        <View className="absolute inset-0 items-center justify-center">
          <View className="cn-input-otp-caret-line" />
        </View>
      ) : null}
    </View>
  );
}

/** A dash between two InputOTPGroups, hidden from screen readers with the slots. */
function InputOTPSeparator({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    <IconClassContext.Provider value="cn-input-otp-separator/icon">
      <View aria-hidden className={cn('flex-row items-center cn-input-otp-separator', className)} {...props}>
        <Icon as={Minus} />
      </View>
    </IconClassContext.Provider>
  );
}

export {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  REGEXP_ONLY_CHARS,
  REGEXP_ONLY_DIGITS,
  REGEXP_ONLY_DIGITS_AND_CHARS,
};
export type { InputOTPLabelProps, InputOTPProps, InputOTPSlotProps };

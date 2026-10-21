import { cva, type VariantProps } from 'class-variance-authority';
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { Pressable, View, type PressableStateCallbackType, type TextInputInstance } from 'react-native';
import { cn } from '../lib/utils';
import { Button, type ButtonProps } from './button';
import { IconClassContext } from './icon';
import { Input, type InputProps } from './input';
import { Text, TextClassContext, type TextProps } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes,
// `cn-<slot>/icon` for the size it gives an icon, and `cn-<slot>@<state>` for the classes behind that
// state, such as `@focused` while the group's input holds focus; the registry build replaces each with
// the classes translated for the target engine.

/** The state of the group's input, which the group draws its border and dimming from. */
interface InputGroupControlState {
  focused: boolean;
  invalid: boolean;
  disabled: boolean;
}

/** What the parts of an InputGroup read from it, and how its input reports its state back. */
const InputGroupContext = createContext<
  | {
      control: InputGroupControlState;
      setControl: (change: Partial<InputGroupControlState>) => void;
      controlRef: RefObject<TextInputInstance | null>;
      /** Whether a block addon stacks the group into a column. */
      stacked: boolean;
    }
  | undefined
>(undefined);

type InputGroupAddonAlign = NonNullable<VariantProps<typeof inputGroupAddonVariants>['align']>;

/** Where an addon of each alignment goes among the group's children: before the input, or after it. */
const ADDON_ORDER = {
  'inline-start': -1,
  'block-start': -1,
  'inline-end': 1,
  'block-end': 1,
} as const satisfies Record<InputGroupAddonAlign, number>;

function addonAlignOf(child: ReactNode): InputGroupAddonAlign | undefined {
  if (!isValidElement<InputGroupAddonProps>(child) || child.type !== InputGroupAddon) return undefined;
  return child.props.align ?? 'inline-start';
}

/**
 * An input with addons beside it, above it or below it, drawn as one field: the group takes the
 * focus border while its input holds focus, the destructive border while the input is
 * `aria-invalid`, and the dimming of a disabled input. Its children are one InputGroupInput and
 * InputGroupAddons; each addon is placed by its `align`, a start addon before the input and an end
 * addon after it, and a block addon stacks the group into a column, so the addons are its direct
 * children.
 */
function InputGroup({ className, children, ...props }: ComponentProps<typeof View>): ReactNode {
  const [control, setControlState] = useState<InputGroupControlState>({
    focused: false,
    invalid: false,
    disabled: false,
  });
  const controlRef = useRef<TextInputInstance | null>(null);
  const setControl = useCallback(
    (change: Partial<InputGroupControlState>) => setControlState((current) => ({ ...current, ...change })),
    [],
  );

  const items = Children.toArray(children);
  const aligns = items.map(addonAlignOf);
  const blockStart = aligns.includes('block-start');
  const blockEnd = aligns.includes('block-end');
  const orderOf = (index: number): number => {
    const align = aligns[index];
    return align === undefined ? 0 : ADDON_ORDER[align];
  };
  const ordered = items.map((item, index) => ({ item, order: orderOf(index) })).sort((a, b) => a.order - b.order);

  return (
    <InputGroupContext.Provider value={{ control, setControl, controlRef, stacked: blockStart || blockEnd }}>
      <View
        role="group"
        className={cn(
          'relative w-full min-w-0 flex-row items-center cn-input-group',
          control.focused && 'cn-input-group@focused',
          control.invalid && 'cn-input-group@invalid',
          control.disabled && 'cn-input-group@disabled',
          blockStart && 'cn-input-group@align=block-start',
          blockEnd && 'cn-input-group@align=block-end',
          className,
        )}
        {...props}
      >
        {ordered.map(({ item }) => item)}
      </View>
    </InputGroupContext.Provider>
  );
}

const inputGroupAddonVariants = cva('flex-row items-center justify-center cn-input-group-addon', {
  variants: {
    align: {
      'inline-start': 'cn-input-group-addon-align-inline-start',
      'inline-end': 'cn-input-group-addon-align-inline-end',
      'block-start': 'w-full justify-start cn-input-group-addon-align-block-start',
      'block-end': 'w-full justify-start cn-input-group-addon-align-block-end',
    },
  },
  defaultVariants: {
    align: 'inline-start',
  },
});

type InputGroupAddonProps = ComponentProps<typeof Pressable> & VariantProps<typeof inputGroupAddonVariants>;

/**
 * Text, icons or buttons beside the group's input, in the muted colour; an Icon inside takes 16px.
 * `align` places it at the start or end of the line (`inline-start`, the default, or `inline-end`),
 * or on a line of its own above or below the input (`block-start` or `block-end`). Pressing it
 * focuses the input; a button inside takes its own press.
 */
function InputGroupAddon({ className, align, onPress, ...props }: InputGroupAddonProps): ReactNode {
  const group = useContext(InputGroupContext);

  return (
    <TextClassContext.Provider value="cn-input-group-addon/text">
      <IconClassContext.Provider value="cn-input-group-addon/icon">
        <Pressable
          accessible={false}
          className={cn(
            inputGroupAddonVariants({ align }),
            group?.control.disabled && 'cn-input-group-addon@disabled',
            className,
          )}
          onPress={(event) => {
            group?.controlRef.current?.focus();
            onPress?.(event);
          }}
          {...props}
        />
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

const inputGroupButtonVariants = cva('flex-row items-center shadow-none cn-input-group-button', {
  variants: {
    size: {
      xs: 'cn-input-group-button-size-xs',
      'icon-xs': 'cn-input-group-button-size-icon-xs',
      'icon-sm': 'cn-input-group-button-size-icon-sm',
    },
  },
  defaultVariants: {
    size: 'xs',
  },
});

const inputGroupButtonIconVariants = cva('', {
  variants: {
    size: {
      xs: 'cn-input-group-button-size-xs/icon',
      'icon-xs': 'cn-input-group-button-size-icon-xs/icon',
      'icon-sm': 'cn-input-group-button-size-icon-sm/icon',
    },
  },
  defaultVariants: {
    size: 'xs',
  },
});

type InputGroupButtonProps = Omit<ButtonProps, 'size'> & VariantProps<typeof inputGroupButtonVariants>;

/**
 * A Button sized to sit inside an addon, `ghost` unless given another variant: `xs`, the default,
 * for a short label, and `icon-xs` or `icon-sm` for an icon alone, which is named with `aria-label`.
 */
function InputGroupButton({
  className,
  variant = 'ghost',
  size,
  children,
  ...props
}: InputGroupButtonProps): ReactNode {
  const iconClass = inputGroupButtonIconVariants({ size });
  // A size that gives its icon no size of its own leaves the icon at the Button's.
  const withIconSize = (content: ReactNode): ReactNode =>
    iconClass ? <IconClassContext.Provider value={iconClass}>{content}</IconClassContext.Provider> : content;

  return (
    <Button variant={variant} className={cn(inputGroupButtonVariants({ size }), className)} {...props}>
      {typeof children === 'function'
        ? (state: PressableStateCallbackType) => withIconSize(children(state))
        : withIconSize(children)}
    </Button>
  );
}

/** A label or a unit inside an addon, such as `https://` or `USD`, in the addon's muted colour. */
function InputGroupText({ className, ...props }: TextProps): ReactNode {
  return <Text className={cn('cn-input-group-text/text', className)} {...props} />;
}

type InputGroupInputProps = InputProps & {
  /** The input, for the caller to focus or read; the group holds it too, to focus it from an addon. */
  ref?: Ref<TextInputInstance>;
};

/**
 * The group's text field: an Input with no border of its own, whose focus, `aria-invalid` and
 * `editable={false}` the group draws around it and its addons.
 */
function InputGroupInput({
  className,
  ref,
  editable,
  'aria-invalid': invalid,
  onFocus,
  onBlur,
  ...props
}: InputGroupInputProps): ReactNode {
  const group = useContext(InputGroupContext);
  const setControl = group?.setControl;
  const controlRef = group?.controlRef;

  useEffect(() => {
    setControl?.({ invalid: invalid === true, disabled: editable === false });
  }, [setControl, invalid, editable]);

  const attach = useCallback(
    (node: TextInputInstance | null) => {
      if (controlRef) controlRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [controlRef, ref],
  );

  return (
    <Input
      ref={attach}
      className={cn('cn-input-group-input', group?.stacked ? 'w-full' : 'flex-1', className)}
      editable={editable}
      aria-invalid={invalid}
      onFocus={(event) => {
        setControl?.({ focused: true });
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setControl?.({ focused: false });
        onBlur?.(event);
      }}
      {...props}
    />
  );
}

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText };
export type { InputGroupAddonProps, InputGroupButtonProps, InputGroupInputProps };

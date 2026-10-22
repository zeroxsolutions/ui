import * as SelectPrimitive from '@rn-primitives/select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useHighlight, useMenuScrollHeight } from '../lib/menu';
import { usePopupMotion, type PopupSide } from '../lib/motion';
import { useModalOverlay, usePortalHostCheck } from '../lib/overlay';
import { cn } from '../lib/utils';
import { Icon, IconClassContext } from './icon';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` and `cn-<slot>/icon` for its
// text and icon classes, and `cn-<slot>@<state>` for the classes the style puts behind that state; the
// registry build replaces each with the classes translated for the target engine.

/**
 * The options of a Select by value, as upstream's `items` takes them: a list of labels and values, where a
 * `null` value's label is the placeholder, or a record of labels by value.
 */
type SelectItems = ReadonlyArray<{ label: string; value: string | null }> | Readonly<Record<string, string>>;

/** The label `items` gives `value`, the placeholder's for `null`. */
function labelIn(items: SelectItems | undefined, value: string | null): string | undefined {
  if (items === undefined) return undefined;
  if (isItemList(items)) return items.find((item) => item.value === value)?.label;
  return value === null ? undefined : items[value];
}

function isItemList(items: SelectItems): items is ReadonlyArray<{ label: string; value: string | null }> {
  return Array.isArray(items);
}

/** What the parts of a Select read from it: the chosen value, and the label of any value. */
interface SelectState {
  value: string | undefined;
  /** The label `items` or a drawn SelectItem gives `value`, the placeholder's for `null`; `value` itself when none does. */
  labelOf: (value: string | null) => string | undefined;
  /** Records the label a SelectItem shows for its value, so the trigger shows it once chosen. */
  register: (value: string, label: string) => void;
}

const SelectStateContext = createContext<SelectState>({
  value: undefined,
  labelOf: (value) => value ?? undefined,
  register: () => undefined,
});

/** The Select's trigger, through which its root opens and closes it. */
const SelectTriggerRefContext = createContext<RefObject<SelectPrimitive.TriggerRef | null> | undefined>(undefined);

/**
 * Whether a close comes from the web window being resized, which Radix's list closes on. A page that grows to
 * hold the open list, such as a frame sized to its content, resizes the window as the list opens, which would
 * close it at once; the list is placed again as the window changes, so it stays open.
 */
function closesOnResize(): boolean {
  return Platform.OS === 'web' && (globalThis as { event?: { type?: string } }).event?.type === 'resize';
}

type SelectProps = Omit<SelectPrimitive.RootProps, 'value' | 'defaultValue' | 'onValueChange'> & {
  /** The chosen value, when the owner holds it; follow `onValueChange` to change it. */
  value?: string;
  /** The value chosen at the start, when the Select holds its own. */
  defaultValue?: string;
  /** Called with an option's value when a press chooses it. */
  onValueChange?: (value: string) => void;
  /** The options' labels by value, so the trigger shows the chosen one's before the list has been opened. */
  items?: SelectItems;
  /** Whether the list is open, when its owner holds the state; follow `onOpenChange` to change it. */
  open?: boolean;
  /** Whether the list starts open, when the Select holds its own state. */
  defaultOpen?: boolean;
};

/**
 * A control that picks one of a list of options, which its trigger opens. It holds the chosen value from
 * `defaultValue`, or follows `value`, and reports each choice through `onValueChange`. Holds a SelectTrigger
 * with a SelectValue, and a SelectContent of SelectItems.
 */
function Select({
  value: valueProp,
  defaultValue,
  onValueChange,
  items,
  open,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}: SelectProps): ReactNode {
  const [ownValue, setOwnValue] = useState(defaultValue);
  const value = valueProp ?? ownValue;
  const [drawnLabels, setDrawnLabels] = useState<Readonly<Record<string, string>>>({});
  const labelOf = (of: string | null) =>
    (of === null ? undefined : drawnLabels[of]) ?? labelIn(items, of) ?? of ?? undefined;
  const register = useCallback((of: string, label: string) => {
    setDrawnLabels((labels) => (labels[of] === label ? labels : { ...labels, [of]: label }));
  }, []);

  const trigger = useRef<SelectPrimitive.TriggerRef>(null);
  // The primitive keeps its open state to itself, and opens and closes only through its trigger.
  const [primitiveOpen, setPrimitiveOpen] = useState(false);

  // Only the first render's defaultOpen counts, as upstream's does.
  const startsOpen = useRef(defaultOpen && open === undefined);
  useEffect(() => {
    if (startsOpen.current) trigger.current?.open();
  }, []);

  useEffect(() => {
    if (open === undefined || open === primitiveOpen) return;
    if (open) trigger.current?.open();
    else trigger.current?.close();
  }, [open, primitiveOpen]);

  return (
    <SelectStateContext.Provider value={{ value, labelOf, register }}>
      <SelectTriggerRefContext.Provider value={trigger}>
        <SelectPrimitive.Root
          value={value === undefined ? undefined : { value, label: labelOf(value) ?? value }}
          onValueChange={(option) => {
            if (option === undefined) return;
            setOwnValue(option.value);
            onValueChange?.(option.value);
          }}
          onOpenChange={(next) => {
            if (!next && closesOnResize()) {
              trigger.current?.open();
              return;
            }
            setPrimitiveOpen(next);
            // Following `open` itself is no change the owner asked for.
            if (next !== open) onOpenChange?.(next);
          }}
          {...props}
        >
          {children}
        </SelectPrimitive.Root>
      </SelectTriggerRefContext.Provider>
    </SelectStateContext.Provider>
  );
}

/** The part of a DOM element the web's trigger naming writes; the library is typed without the DOM. */
interface WebElement {
  setAttribute(name: string, value: string): void;
}

type SelectTriggerProps = Omit<ComponentProps<typeof SelectPrimitive.Trigger>, 'children'> & {
  children?: ReactNode;
  /** `sm` draws the trigger 32px tall rather than 36px. */
  size?: 'sm' | 'default';
  /**
   * Draws the destructive border. React Native does not announce it, so carry the error in
   * `accessibilityHint` or in a Text the user can reach.
   */
  'aria-invalid'?: boolean;
};

/**
 * The field that shows the chosen option and opens the list, with a chevron at its end. It is announced as
 * a `combobox`, expanded or collapsed; name it with `aria-label`. Focus returns to it when the list closes.
 * A disabled trigger is dimmed and ignores presses.
 */
function SelectTrigger({
  className,
  size = 'default',
  'aria-invalid': invalid,
  children,
  ref,
  ...props
}: SelectTriggerProps): ReactNode {
  const rootRef = useContext(SelectTriggerRefContext);
  const composed = useCallback(
    (node: SelectPrimitive.TriggerRef | null) => {
      if (rootRef !== undefined) rootRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
      // The web's primitive draws the trigger as a button over Radix's combobox, and takes no role of its own,
      // so the element is named a combobox once it is drawn. A device's primitive names it one itself.
      if (Platform.OS === 'web') (node as unknown as WebElement | null)?.setAttribute('role', 'combobox');
    },
    [rootRef, ref],
  );
  return (
    <TextClassContext.Provider value="cn-select-trigger/text">
      <IconClassContext.Provider value="cn-select-trigger/icon">
        <SelectPrimitive.Trigger
          ref={composed}
          className={cn(
            'flex-row items-center justify-between cn-select-trigger',
            size === 'sm' ? 'cn-select-trigger@size=sm' : 'cn-select-trigger@size=default',
            invalid && 'cn-select-trigger@invalid',
            props.disabled === true && 'opacity-50',
            className,
          )}
          aria-invalid={invalid}
          {...props}
        >
          {children}
          <Icon as={ChevronDown} className="cn-select-trigger-icon cn-select-trigger-icon/text" />
        </SelectPrimitive.Trigger>
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

type SelectValueProps = ComponentProps<typeof Text> & {
  /** What the trigger shows, muted, while nothing is chosen; the `null` item's label of `items` when left out. */
  placeholder?: string;
};

/** The chosen option's label in the trigger, or the placeholder, muted, while nothing is chosen. */
function SelectValue({ className, placeholder, ...props }: SelectValueProps): ReactNode {
  const { value, labelOf } = useContext(SelectStateContext);
  const empty = value === undefined;
  return (
    <Text
      numberOfLines={1}
      className={cn('cn-select-value cn-select-value/text', empty && 'cn-select-trigger/text@placeholder', className)}
      {...props}
    >
      {empty ? (placeholder ?? labelOf(null)) : labelOf(value)}
    </Text>
  );
}

type SelectContentProps = Omit<
  SelectPrimitive.ContentProps,
  'side' | 'insets' | 'disablePositioningStyle' | 'position' | 'children'
> & {
  children?: ReactNode;
  /**
   * The side of the trigger the list opens on. On a device it opens above or below the trigger, so `left`
   * and `right` open it below.
   */
  side?: PopupSide;
  /** The `name` of the PortalHost to draw in, when it is not the app's own. */
  portalHost?: string;
};

/**
 * The list of options, drawn 4px below its trigger, centred on it and at least as wide, announced as a list;
 * accessibility focus moves into it as it opens. A press outside it, the Android back button, the iOS escape
 * gesture and Escape on the web close it. It fades in while growing from 95% and sliding 0.5rem away from the
 * trigger over 100ms, and out the same way on a device, or appears and goes at once when the system asks for
 * reduced motion.
 */
function SelectContent({
  className,
  children,
  align = 'center',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  portalHost,
  ...props
}: SelectContentProps): ReactNode {
  const root = SelectPrimitive.useRootContext() as ReturnType<typeof SelectPrimitive.useRootContext> & {
    triggerPosition?: { width: number } | null;
  };
  const { open, onOpenChange } = root;
  // The primitive places the list above or below its trigger on a device; the web's places it on any side.
  const placed = Platform.OS === 'web' || side === 'top' ? side : 'bottom';
  const { present, style } = usePopupMotion(open, placed);
  const scrollHeight = useMenuScrollHeight();
  const hostCheck = usePortalHostCheck(present, 'Select', portalHost);
  // Upstream's list is modal: the screen behind it is out of a screen reader's reach while it is open.
  const modalLayer = useModalOverlay(present);

  // The web's Radix list goes as soon as it closes, so there it is drawn only while open.
  if (!present || (Platform.OS === 'web' && !open)) return null;

  const list = (
    <SelectPrimitive.Content
      align={align}
      alignOffset={alignOffset}
      // The web's primitive takes every side, though its type names only the two a device's takes.
      side={side as SelectPrimitive.ContentProps['side']}
      sideOffset={sideOffset}
      position="popper"
      {...(Platform.OS === 'web' ? {} : { forceMount: true as const })}
      {...props}
    >
      <TextClassContext.Provider value="cn-select-content/text">
        {/* Not every engine styles an Animated.View by its className, so the box is a View inside it. */}
        <Animated.View style={style}>
          <View
            className={cn('cn-select-content', className)}
            // Upstream's list is as wide as its trigger at least, and on the web no taller than the room below it,
            // where Radix scrolls its options.
            style={
              Platform.OS === 'web'
                ? ({
                    minWidth: 'var(--radix-select-trigger-width)',
                    maxHeight: 'var(--radix-select-content-available-height)',
                  } as unknown as ViewStyle)
                : { minWidth: root.triggerPosition?.width }
            }
          >
            <SelectScrollUpButton />
            {/* Radix's viewport grows from no height, which in a list of no set height scrolls it at its own size. */}
            <SelectPrimitive.Viewport style={{ flex: '1 1 auto' }}>
              {Platform.OS === 'web' ? (
                children
              ) : (
                // On the web Radix scrolls a list too tall for the window; a device scrolls it here.
                <ScrollView style={{ maxHeight: scrollHeight }} bounces={false} keyboardShouldPersistTaps="handled">
                  {children}
                </ScrollView>
              )}
            </SelectPrimitive.Viewport>
            <SelectScrollDownButton />
          </View>
        </Animated.View>
      </TextClassContext.Provider>
    </SelectPrimitive.Content>
  );

  return (
    <SelectPrimitive.Portal hostName={portalHost} forceMount>
      {/* The web's portal slots its one child into the page, where Radix places the list and closes it on a
          press outside; a device draws the list in a full-screen layer of its own. */}
      {Platform.OS === 'web' ? (
        list
      ) : (
        // Closing, it lets presses through to the screen while it fades.
        <View style={[StyleSheet.absoluteFill, { pointerEvents: open ? 'box-none' : 'none' }]} {...modalLayer}>
          {hostCheck}
          {/* A press outside the list lands here. It closes through the open state alone: the primitive's own
              close forgets where the trigger is, which removes the list before it can go out. */}
          <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={() => onOpenChange(false)} />
          {list}
        </View>
      )}
    </SelectPrimitive.Portal>
  );
}

type SelectGroupProps = ComponentProps<typeof SelectPrimitive.Group>;

/** Options that belong together, announced as a `group`; a SelectLabel inside names what they are. */
function SelectGroup({ className, ...props }: SelectGroupProps): ReactNode {
  return <SelectPrimitive.Group className={cn('cn-select-group', className)} {...props} />;
}

type SelectLabelProps = ComponentProps<typeof Text>;

/** The muted heading over a group of options. */
function SelectLabel({ className, ...props }: SelectLabelProps): ReactNode {
  return (
    <SelectPrimitive.Label asChild>
      <Text className={cn('cn-select-label cn-select-label/text', className)} {...props} />
    </SelectPrimitive.Label>
  );
}

type SelectItemProps = Omit<SelectPrimitive.ItemProps, 'label' | 'closeOnPress' | 'children'> & {
  /** The option's text, or what it draws; text is drawn as the option's label. */
  children?: ReactNode;
  /** The label the trigger shows once the option is chosen; the text children when left out. */
  label?: string;
};

/**
 * One option of the list, announced with its selected state, with a check mark at its end while chosen. A
 * press chooses it and closes the list. It is highlighted while a finger is on it, or the keyboard's focus on
 * the web. A disabled option is dimmed, announced as disabled and ignores presses.
 */
function SelectItem({ className, value, label, children, onPress, ...props }: SelectItemProps): ReactNode {
  const text = label ?? (typeof children === 'string' ? children : value);
  const { register } = useContext(SelectStateContext);
  useEffect(() => register(value, text), [register, value, text]);
  const { onOpenChange } = SelectPrimitive.useRootContext();
  const { highlighted, handlers } = useHighlight(props);
  const menuText = useContext(TextClassContext);
  // Radix draws the web's option as a div, which takes no press or hover handler of a Pressable.
  const events =
    Platform.OS === 'web'
      ? { onFocus: handlers.onFocus, onBlur: handlers.onBlur }
      : {
          ...handlers,
          // On a device the list closes through the open state alone, so it can go out.
          onPress: (event: GestureResponderEvent) => {
            onPress?.(event);
            onOpenChange(false);
          },
        };
  return (
    <TextClassContext.Provider
      value={cn(menuText, 'cn-select-item/text', highlighted && 'cn-select-item/text@highlighted')}
    >
      <IconClassContext.Provider value="cn-select-item/icon">
        <SelectPrimitive.Item
          value={value}
          label={text}
          closeOnPress={Platform.OS === 'web'}
          className={cn(
            'relative flex w-full flex-row items-center cn-select-item',
            props.disabled === true && 'opacity-50',
            highlighted && 'cn-select-item@highlighted',
            className,
          )}
          {...props}
          {...events}
        >
          {typeof children === 'string' ? (
            <SelectPrimitive.ItemText className="cn-select-item-text cn-select-item-text/text" />
          ) : (
            children
          )}
          <View className="cn-select-item-indicator">
            <SelectPrimitive.ItemIndicator>
              <Icon as={Check} testID="select-check" />
            </SelectPrimitive.ItemIndicator>
          </View>
        </SelectPrimitive.Item>
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

type SelectSeparatorProps = ComponentProps<typeof SelectPrimitive.Separator>;

/** A hairline between groups of options. */
function SelectSeparator({ className, ...props }: SelectSeparatorProps): ReactNode {
  return <SelectPrimitive.Separator className={cn('pointer-events-none cn-select-separator', className)} {...props} />;
}

/**
 * The chevron the web draws at the top of a list too long for the screen, which scrolls it up while the
 * pointer rests on it. A device scrolls the list by a swipe, so it draws nothing there.
 */
function SelectScrollUpButton({ className }: { className?: string }): ReactNode {
  if (Platform.OS !== 'web') return null;
  return (
    <SelectPrimitive.ScrollUpButton>
      <View className={cn('cn-select-scroll-up-button', className)}>
        <Icon as={ChevronUp} className="cn-select-scroll-up-button/icon" />
      </View>
    </SelectPrimitive.ScrollUpButton>
  );
}

/** The chevron the web draws at the bottom of a list too long for the screen; see SelectScrollUpButton. */
function SelectScrollDownButton({ className }: { className?: string }): ReactNode {
  if (Platform.OS !== 'web') return null;
  return (
    <SelectPrimitive.ScrollDownButton>
      <View className={cn('cn-select-scroll-down-button', className)}>
        <Icon as={ChevronDown} className="cn-select-scroll-down-button/icon" />
      </View>
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
export type {
  SelectContentProps,
  SelectGroupProps,
  SelectItemProps,
  SelectItems,
  SelectLabelProps,
  SelectProps,
  SelectSeparatorProps,
  SelectTriggerProps,
  SelectValueProps,
};

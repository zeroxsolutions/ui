import * as PopoverPrimitive from '@rn-primitives/popover';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePopupMotion, type PopupSide } from '../lib/motion';
import { usePortalHostCheck } from '../lib/overlay';
import { cn } from '../lib/utils';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes, and
// `cn-<slot>@<state>` for the classes the style puts behind that state; the registry build replaces each
// with the classes translated for the target engine.

/** The id of the open Popover's PopoverTitle, and whether one is drawn, so the content names itself by it. */
interface PopoverTitle {
  id: string;
  shown: boolean;
  setShown: (shown: boolean) => void;
}

const PopoverTitleContext = createContext<PopoverTitle | undefined>(undefined);

type PopoverProps = PopoverPrimitive.RootProps & {
  /** Whether the Popover is open, when its owner holds the state; follow `onOpenChange` to change it. */
  open?: boolean;
  /** Whether the Popover starts open, when it holds its own state. */
  defaultOpen?: boolean;
};

/** The open Popover's trigger, through which its root opens and closes it. */
const PopoverTriggerRefContext = createContext<RefObject<PopoverPrimitive.TriggerRef | null> | undefined>(undefined);

/**
 * A floating panel beside its trigger, for content the screen does not show in full. It holds its own open
 * state from `defaultOpen`, or follows `open`; either way it reports each open and close a press asks for
 * through `onOpenChange`. Holds a PopoverTrigger and a PopoverContent.
 */
function Popover({ open, defaultOpen = false, onOpenChange, children, ...props }: PopoverProps): ReactNode {
  const id = useId();
  const [shown, setShown] = useState(false);
  const trigger = useRef<PopoverPrimitive.TriggerRef>(null);
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
    <PopoverTitleContext.Provider value={{ id, shown, setShown }}>
      <PopoverTriggerRefContext.Provider value={trigger}>
        <PopoverPrimitive.Root
          onOpenChange={(next) => {
            setPrimitiveOpen(next);
            // Following `open` itself is no change the owner asked for.
            if (next !== open) onOpenChange?.(next);
          }}
          {...props}
        >
          {children}
        </PopoverPrimitive.Root>
      </PopoverTriggerRefContext.Provider>
    </PopoverTitleContext.Provider>
  );
}

type PopoverTriggerProps = ComponentProps<typeof PopoverPrimitive.Trigger>;

/** Opens the Popover when pressed, and closes it when pressed again; pass `asChild` to make a Button the trigger. */
function PopoverTrigger({ ref, ...props }: PopoverTriggerProps): ReactNode {
  const rootRef = useContext(PopoverTriggerRefContext);
  const composed = useCallback(
    (node: PopoverPrimitive.TriggerRef | null) => {
      if (rootRef !== undefined) rootRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [rootRef, ref],
  );
  return <PopoverPrimitive.Trigger ref={composed} {...props} />;
}

/** The part of a DOM element the web's naming reads and writes; the library is typed without the DOM. */
interface WebElement {
  closest(selector: string): WebElement | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

/**
 * Names the web's content by its title. There the primitive draws the `dialog` element itself, around the
 * content, and passes no prop on to it, so the name is set on that element once it is drawn.
 */
function useWebDialogName(title: PopoverTitle | undefined, open: boolean) {
  const ref = useRef<PopoverPrimitive.ContentRef>(null);
  const labelledBy = title?.shown === true ? title.id : undefined;
  useEffect(() => {
    if (Platform.OS !== 'web' || !open) return;
    const dialog = (ref.current as unknown as WebElement | null)?.closest('[role="dialog"]');
    if (labelledBy === undefined) dialog?.removeAttribute('aria-labelledby');
    else dialog?.setAttribute('aria-labelledby', labelledBy);
  }, [labelledBy, open]);
  return { ref, labelledBy };
}

type PopoverContentProps = Omit<PopoverPrimitive.ContentProps, 'side' | 'insets' | 'disablePositioningStyle'> & {
  /**
   * The side of the trigger the content opens on. On a device it opens above or below the trigger, so
   * `left` and `right` open it below.
   */
  side?: PopupSide;
  /** The `name` of the PortalHost to draw in, when it is not the app's own. */
  portalHost?: string;
};

/**
 * The panel itself, drawn beside its trigger, 4px off it and centred on it by default. It is announced as
 * a `dialog` named by its PopoverTitle, and accessibility focus moves into it as it opens. A press outside
 * it, the Android back button, the iOS escape gesture and Escape on the web close it. It fades in while
 * growing from 95% and sliding 0.5rem away from the trigger over 100ms, and out the same way, or appears
 * and goes at once when the system asks for reduced motion.
 */
function PopoverContent({
  className,
  children,
  align = 'center',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  portalHost,
  ...props
}: PopoverContentProps): ReactNode {
  const { open, onOpenChange } = PopoverPrimitive.useRootContext();
  const title = useContext(PopoverTitleContext);
  const { ref, labelledBy } = useWebDialogName(title, open);
  // The primitive places the content above or below its trigger on a device; the web's places it on any side.
  const placed = Platform.OS === 'web' || side === 'top' ? side : 'bottom';
  const { present, style } = usePopupMotion(open, placed);

  const hostCheck = usePortalHostCheck(present, 'Popover', portalHost);

  if (!present) return null;

  const content = (
    <PopoverPrimitive.Content
      forceMount
      ref={ref}
      align={align}
      alignOffset={alignOffset}
      // The web's primitive takes every side, though its type names only the two a device's takes.
      side={side as PopoverPrimitive.ContentProps['side']}
      sideOffset={sideOffset}
      {...(Platform.OS === 'web' ? {} : { 'aria-labelledby': labelledBy })}
      {...props}
    >
      <TextClassContext.Provider value="cn-popover-content/text">
        {/* Not every engine styles an Animated.View by its className, so the box is a View inside it. */}
        <Animated.View style={style}>
          <View className={cn('w-72 cn-popover-content', className)}>{children}</View>
        </Animated.View>
      </TextClassContext.Provider>
    </PopoverPrimitive.Content>
  );

  return (
    <PopoverPrimitive.Portal hostName={portalHost} forceMount>
      {/* The web's portal slots its one child into the page, where Radix places the content and closes it on a
          press outside; a device draws the content in a full-screen layer of its own. */}
      {Platform.OS === 'web' ? (
        content
      ) : (
        // The portal draws outside this tree, so the title is handed in again.
        <PopoverTitleContext.Provider value={title}>
          {/* Closing, it lets presses through to the screen while it fades. */}
          <View style={[StyleSheet.absoluteFill, { pointerEvents: open ? 'box-none' : 'none' }]}>
            {hostCheck}
            {/* A press outside the content lands here. It closes through the open state alone: the primitive's
                own close forgets where the trigger is, which removes the content before it can go out. */}
            <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={() => onOpenChange(false)} />
            {content}
          </View>
        </PopoverTitleContext.Provider>
      )}
    </PopoverPrimitive.Portal>
  );
}

type PopoverHeaderProps = ComponentProps<typeof View>;

/** The top of a PopoverContent, holding its PopoverTitle and PopoverDescription. */
function PopoverHeader({ className, ...props }: PopoverHeaderProps): ReactNode {
  return (
    <TextClassContext.Provider value={cn(useContext(TextClassContext), 'cn-popover-header/text')}>
      <View className={cn('cn-popover-header', className)} {...props} />
    </TextClassContext.Provider>
  );
}

type PopoverTitleProps = ComponentProps<typeof Text>;

/** The Popover's heading, which names its content. */
function PopoverTitle({ className, ...props }: PopoverTitleProps): ReactNode {
  const title = useContext(PopoverTitleContext);
  const setShown = title?.setShown;
  useEffect(() => {
    setShown?.(true);
    return () => setShown?.(false);
  }, [setShown]);
  return <Text role="heading" nativeID={title?.id} className={cn('cn-popover-title/text', className)} {...props} />;
}

type PopoverDescriptionProps = ComponentProps<typeof Text>;

/** The muted text under a PopoverTitle saying what the Popover is for. */
function PopoverDescription({ className, ...props }: PopoverDescriptionProps): ReactNode {
  return <Text className={cn('cn-popover-description/text', className)} {...props} />;
}

export { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger };
export type {
  PopoverContentProps,
  PopoverDescriptionProps,
  PopoverHeaderProps,
  PopoverProps,
  PopoverTitleProps,
  PopoverTriggerProps,
};

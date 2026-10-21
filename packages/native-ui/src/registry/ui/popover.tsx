import * as PopoverPrimitive from '@rn-primitives/popover';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle } from 'react-native-reanimated';
import { usePresence } from '../lib/motion';
import { usePortalHostCheck } from '../lib/overlay';
import { cn } from '../lib/utils';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes, and
// `cn-<slot>@<state>` for the classes the style puts behind that state; the registry build replaces each
// with the classes translated for the target engine.

/** Upstream's 100ms fade, zoom from 95% and 0.5rem slide in from the trigger's side. */
const POPOVER_MOTION = { duration: 100, easing: Easing.bezier(0.25, 0.1, 0.25, 1) } as const;

/** Upstream's `slide-in-from-*-2`, the 0.5rem the content slides in by, in px at the theme's 16px rem. */
const POPOVER_SLIDE = 8;

type PopoverSide = 'top' | 'right' | 'bottom' | 'left';

/** The content grows out of the edge that faces its trigger. */
const TRANSFORM_ORIGIN: Readonly<Record<PopoverSide, string>> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

/** The id of the open Popover's PopoverTitle, and whether one is drawn, so the content names itself by it. */
interface PopoverTitle {
  id: string;
  shown: boolean;
  setShown: (shown: boolean) => void;
}

const PopoverTitleContext = createContext<PopoverTitle | undefined>(undefined);

type PopoverProps = PopoverPrimitive.RootProps;

/**
 * A floating panel beside its trigger, for content the screen does not show in full. It holds its own open
 * state and reports each change through `onOpenChange`. Holds a PopoverTrigger and a PopoverContent.
 */
function Popover({ children, ...props }: PopoverProps): ReactNode {
  const id = useId();
  const [shown, setShown] = useState(false);
  return (
    <PopoverTitleContext.Provider value={{ id, shown, setShown }}>
      <PopoverPrimitive.Root {...props}>{children}</PopoverPrimitive.Root>
    </PopoverTitleContext.Provider>
  );
}

type PopoverTriggerProps = PopoverPrimitive.TriggerProps;

/** Opens the Popover when pressed, and closes it when pressed again; pass `asChild` to make a Button the trigger. */
function PopoverTrigger(props: PopoverTriggerProps): ReactNode {
  return <PopoverPrimitive.Trigger {...props} />;
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
  side?: PopoverSide;
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
  const { present, progress, reduced } = usePresence(open, POPOVER_MOTION);
  // The primitive places the content above or below its trigger on a device; the web's places it on any side.
  const placed = Platform.OS === 'web' || side === 'top' ? side : 'bottom';
  const motion = useAnimatedStyle(() => {
    const offset = (1 - progress.value) * POPOVER_SLIDE;
    return {
      opacity: progress.value,
      transform: [
        placed === 'top' || placed === 'bottom'
          ? { translateY: placed === 'top' ? offset : -offset }
          : { translateX: placed === 'left' ? offset : -offset },
        { scale: 0.95 + progress.value * 0.05 },
      ],
    };
  });

  const hostCheck = usePortalHostCheck(present, 'Popover', portalHost);

  if (!present) return null;

  return (
    <PopoverPrimitive.Portal hostName={portalHost} forceMount>
      {hostCheck}
      {/* The portal draws outside this tree, so the title is handed in again. */}
      <PopoverTitleContext.Provider value={title}>
        {/* Closing, it lets presses through to the screen while it fades. */}
        <View style={[StyleSheet.absoluteFill, { pointerEvents: open ? 'box-none' : 'none' }]}>
          {/* A press outside the content lands here. The web's primitive closes on one itself. It closes
              through the open state alone: the primitive's own close forgets where the trigger is, which
              removes the content before it can go out. */}
          {Platform.OS !== 'web' && (
            <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={() => onOpenChange(false)} />
          )}
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
              <Animated.View style={[{ transformOrigin: TRANSFORM_ORIGIN[placed] }, !reduced && motion]}>
                <View className={cn('w-72 cn-popover-content', className)}>{children}</View>
              </Animated.View>
            </TextClassContext.Provider>
          </PopoverPrimitive.Content>
        </View>
      </PopoverTitleContext.Provider>
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

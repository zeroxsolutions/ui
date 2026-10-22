import * as DrawerPrimitive from '@rn-primitives/dialog';
import { createContext, useContext, useEffect, useId, useMemo, type ComponentProps, type ReactNode } from 'react';
import {
  PanResponder,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type PanResponderGestureState,
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { usePresence } from '../lib/motion';
import { useModalOverlay, usePortalHostCheck } from '../lib/overlay';
import { cn } from '../lib/utils';
import { useSidesSwapped } from './direction';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes, and
// `cn-<slot>@<state>` for the classes the style puts behind that state; the registry build replaces each
// with the classes translated for the target engine.

/** Upstream's 450ms open on `cubic-bezier(0.22, 1, 0.36, 1)`. */
const DRAWER_OPEN_MOTION = { duration: 450, easing: Easing.bezier(0.22, 1, 0.36, 1) } as const;
/** Upstream's close, 400ms at a swipe strength of 1, on the open's curve. */
const DRAWER_CLOSE_MOTION = { duration: 400, easing: Easing.bezier(0.22, 1, 0.36, 1) } as const;

/** How far a swipe toward the edge moves before the drawer takes it from the screen, in px. */
const DRAWER_SWIPE_SLOP = 8;
/** The share of its size a drawer swiped and let go of has to have travelled to close. */
const DRAWER_SWIPE_CLOSE_DISTANCE = 0.25;
/** The speed toward its edge, in px per ms, at which a drawer let go of closes however far it travelled. */
const DRAWER_SWIPE_CLOSE_VELOCITY = 0.5;
/** Upstream's 6rem a drawer along the y axis stays short of the screen's height, in px. */
const DRAWER_TOP_GAP = 96;

type DrawerSwipeDirection = 'up' | 'down' | 'left' | 'right';

interface DrawerState {
  swipeDirection: DrawerSwipeDirection;
  showSwipeHandle: boolean;
  /** The `nativeID` of the DrawerTitle, which names the content on Android. */
  titleId: string | undefined;
}

const DrawerContext = createContext<DrawerState>({
  swipeDirection: 'down',
  showSwipeHandle: false,
  titleId: undefined,
});

/** Whether the drawer moves along the y axis, `down` or `up`, rather than the x axis. */
function drawerAlongY(direction: DrawerSwipeDirection): boolean {
  return direction === 'down' || direction === 'up';
}

/** +1 for a drawer that leaves the screen toward larger coordinates, `down` or `right`, else -1. */
function drawerSign(direction: DrawerSwipeDirection): number {
  return direction === 'down' || direction === 'right' ? 1 : -1;
}

type DrawerProps = DrawerPrimitive.RootProps & {
  /** The way a swipe closes the drawer, which also sets the edge it is attached to: `down` attaches it to the bottom. */
  swipeDirection?: DrawerSwipeDirection;
  /** Draws a bar on the drawer's inner edge that shows it can be swiped. */
  showSwipeHandle?: boolean;
};

/**
 * A panel attached to an edge of the screen that a swipe toward that edge closes. It holds its own open
 * state from `defaultOpen`, or follows `open` and reports each change through `onOpenChange`. Holds a
 * DrawerTrigger and a DrawerContent.
 */
function Drawer({ swipeDirection = 'down', showSwipeHandle = false, children, ...props }: DrawerProps): ReactNode {
  const titleId = useId();
  return (
    <DrawerContext.Provider value={{ swipeDirection, showSwipeHandle, titleId }}>
      <DrawerPrimitive.Root {...props}>{children}</DrawerPrimitive.Root>
    </DrawerContext.Provider>
  );
}

type DrawerTriggerProps = DrawerPrimitive.TriggerProps;

/** Opens the Drawer when pressed; pass `asChild` to make a Button the trigger. Focus returns here on close. */
function DrawerTrigger(props: DrawerTriggerProps): ReactNode {
  return <DrawerPrimitive.Trigger {...props} />;
}

type DrawerPortalProps = DrawerPrimitive.PortalProps;

/** Draws its children in the app's PortalHost, or the one `hostName` names, while the Drawer is open. */
function DrawerPortal(props: DrawerPortalProps): ReactNode {
  return <DrawerPrimitive.Portal {...props} />;
}

type DrawerCloseProps = DrawerPrimitive.CloseProps;

/** Closes the Drawer when pressed; pass `asChild` to make a Button do it. */
function DrawerClose(props: DrawerCloseProps): ReactNode {
  return <DrawerPrimitive.Close {...props} />;
}

type DrawerOverlayProps = DrawerPrimitive.OverlayProps;

/** The dimmed backdrop behind the content, filling the screen; a press on it closes the Drawer. */
function DrawerOverlay({ className, ...props }: DrawerOverlayProps): ReactNode {
  return <DrawerPrimitive.Overlay className={cn('absolute inset-0 cn-drawer-overlay', className)} {...props} />;
}

type DrawerSwipeHandleProps = ComponentProps<typeof View>;

/** The bar on the drawer's inner edge that shows it can be swiped; hidden from screen readers. */
function DrawerSwipeHandle({ className, ...props }: DrawerSwipeHandleProps): ReactNode {
  const { swipeDirection } = useContext(DrawerContext);
  const alongY = drawerAlongY(swipeDirection);
  return (
    <View
      aria-hidden
      className={cn(
        'relative z-10 flex-row shrink-0 cn-drawer-swipe-handle',
        alongY ? 'cn-drawer-swipe-handle@swipe-axis=y' : 'cn-drawer-swipe-handle@swipe-axis=x',
        swipeDirection === 'down' && 'cn-drawer-swipe-handle@swipe-direction=down',
        swipeDirection === 'up' && 'cn-drawer-swipe-handle@swipe-direction=up',
        swipeDirection === 'left' && 'cn-drawer-swipe-handle@swipe-direction=left',
        swipeDirection === 'right' && 'cn-drawer-swipe-handle@swipe-direction=right',
        className,
      )}
      {...props}
    >
      <View
        className={cn(
          'cn-drawer-swipe-handle@part=after',
          alongY ? 'cn-drawer-swipe-handle@part=after+swipe-axis=y' : 'cn-drawer-swipe-handle@part=after+swipe-axis=x',
        )}
      />
    </View>
  );
}

type DrawerContentProps = DrawerPrimitive.ContentProps & {
  /** The `name` of the PortalHost to draw in, when it is not the app's own. */
  portalHost?: string;
};

/**
 * The panel itself, over a dimmed overlay, attached to the edge the Drawer's `swipeDirection` swipes
 * toward: across the bottom or top at its content's height, up to 6rem short of the screen's, or down
 * the left or right side at three quarters of its width. It is announced as a modal `dialog` named by its
 * DrawerTitle, and accessibility focus moves into it as it opens. A swipe toward its edge past a quarter of
 * its size, or a flick, closes it, and a shorter one lets it settle back; a press on the overlay, the Android
 * back button, the iOS escape gesture and Escape on the web close it too. It slides in from its edge over
 * 450ms and out over 400ms, or appears and goes at once when the system asks for reduced motion.
 */
function DrawerContent({ className, children, portalHost, onLayout, ...props }: DrawerContentProps): ReactNode {
  const { open, onOpenChange } = DrawerPrimitive.useRootContext();
  const drawer = useContext(DrawerContext);
  const { swipeDirection, showSwipeHandle } = drawer;
  const alongY = drawerAlongY(swipeDirection);
  // Along x it moves toward the edge it is drawn on.
  const swapped = useSidesSwapped();
  const sign = drawerSign(swipeDirection) * (!alongY && swapped ? -1 : 1);
  const window = useWindowDimensions();
  const { present, progress, reduced } = usePresence(open, DRAWER_OPEN_MOTION, DRAWER_CLOSE_MOTION);
  // The panel's size along its axis once laid out, else the screen's, and how far a swipe has moved it.
  const size = useSharedValue(alongY ? window.height : window.width);
  const drag = useSharedValue(0);

  useEffect(() => {
    if (open) drag.value = 0;
  }, [open, drag]);

  const swipe = useMemo(() => {
    const travel = (gesture: PanResponderGestureState): number => (alongY ? gesture.dy : gesture.dx) * sign;
    const across = (gesture: PanResponderGestureState): number => (alongY ? gesture.dx : gesture.dy);
    const settle = (gesture: PanResponderGestureState): void => {
      const speed = (alongY ? gesture.vy : gesture.vx) * sign;
      if (drag.value > size.value * DRAWER_SWIPE_CLOSE_DISTANCE || speed > DRAWER_SWIPE_CLOSE_VELOCITY) {
        onOpenChange(false);
      } else {
        drag.value = reduced ? 0 : withTiming(0, DRAWER_OPEN_MOTION);
      }
    };
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) =>
        travel(gesture) > DRAWER_SWIPE_SLOP && Math.abs(travel(gesture)) > Math.abs(across(gesture)),
      onPanResponderMove: (_event, gesture) => {
        drag.value = Math.max(0, travel(gesture));
      },
      onPanResponderRelease: (_event, gesture) => settle(gesture),
      onPanResponderTerminate: (_event, gesture) => settle(gesture),
    });
  }, [alongY, sign, reduced, onOpenChange, drag, size]);

  // A swipe moves the drawer under reduced motion too, as the finger does; only the slide in and out goes.
  const swiped = (): number => 1 - Math.min(1, drag.value / Math.max(size.value, 1));
  const toEdge = (offset: number) => (alongY ? [{ translateY: sign * offset }] : [{ translateX: sign * offset }]);
  const fade = useAnimatedStyle(() => ({ opacity: progress.value * swiped() }));
  const slide = useAnimatedStyle(() => ({ transform: toEdge((1 - progress.value) * (size.value + 2) + drag.value) }));
  const stillFade = useAnimatedStyle(() => ({ opacity: swiped() }));
  const stillSlide = useAnimatedStyle(() => ({ transform: toEdge(drag.value) }));

  const hostCheck = usePortalHostCheck(present, 'Drawer', portalHost);
  // Drawn beside the app's screens, the outermost layer is the one that keeps VoiceOver inside the overlay.
  const modalLayer = useModalOverlay(present);

  if (!present) return null;

  return (
    <DrawerPortal hostName={portalHost} forceMount>
      {hostCheck}
      {/* The portal draws outside this tree, so the Drawer's state is handed in again. */}
      <DrawerContext.Provider value={drawer}>
        {/* Closing, it lets presses through to the screen while it slides out. */}
        <View {...modalLayer} style={[StyleSheet.absoluteFill, { pointerEvents: open ? 'box-none' : 'none' }]}>
          <Animated.View style={[StyleSheet.absoluteFill, reduced ? stillFade : fade]}>
            <DrawerOverlay forceMount />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { pointerEvents: 'box-none' }, reduced ? stillSlide : slide]}>
            <TextClassContext.Provider value="cn-drawer-popup/text">
              <DrawerPrimitive.Content
                forceMount
                {...drawerLabelledBy(drawer.titleId)}
                onLayout={(event: LayoutChangeEvent) => {
                  size.value = alongY ? event.nativeEvent.layout.height : event.nativeEvent.layout.width;
                  onLayout?.(event);
                }}
                style={alongY ? { maxHeight: window.height - DRAWER_TOP_GAP } : undefined}
                className={cn(
                  'absolute cn-drawer-popup',
                  alongY ? 'inset-x-0 flex-col' : 'inset-y-0 w-3/4 flex-row',
                  swipeDirection === 'down' && 'bottom-0 cn-drawer-popup@swipe-direction=down',
                  swipeDirection === 'up' && 'top-0 cn-drawer-popup@swipe-direction=up',
                  swipeDirection === 'left' && 'left-0 cn-drawer-popup@swipe-direction=left',
                  swipeDirection === 'right' && 'right-0 cn-drawer-popup@swipe-direction=right',
                  className,
                )}
                {...swipe.panHandlers}
                {...props}
              >
                {/* The handle sits on the edge the drawer is swiped away from, after the content when that is its end. */}
                {showSwipeHandle && (swipeDirection === 'down' || swipeDirection === 'right') && <DrawerSwipeHandle />}
                <View className={cn('min-h-0 flex-col overflow-hidden', alongY ? 'shrink' : 'flex-1')}>{children}</View>
                {showSwipeHandle && (swipeDirection === 'up' || swipeDirection === 'left') && <DrawerSwipeHandle />}
              </DrawerPrimitive.Content>
            </TextClassContext.Provider>
          </Animated.View>
        </View>
      </DrawerContext.Provider>
    </DrawerPortal>
  );
}

/**
 * The props that name the content by its title on a device. The web's primitive names it itself, and a key
 * given here, even undefined, would replace the id it passes down.
 */
function drawerLabelledBy(titleId: string | undefined): { 'aria-labelledby'?: string } {
  return Platform.OS === 'web' ? {} : { 'aria-labelledby': titleId };
}

type DrawerHeaderProps = ComponentProps<typeof View>;

/** The top of a DrawerContent, holding its DrawerTitle and DrawerDescription, centred in a top or bottom drawer. */
function DrawerHeader({ className, ...props }: DrawerHeaderProps): ReactNode {
  const { swipeDirection } = useContext(DrawerContext);
  const textClass = useContext(TextClassContext);
  return (
    <TextClassContext.Provider value={cn(textClass, drawerAlongY(swipeDirection) && 'text-center')}>
      <View className={cn('shrink-0 flex-col cn-drawer-header-base', className)} {...props} />
    </TextClassContext.Provider>
  );
}

type DrawerFooterProps = ComponentProps<typeof View>;

/** The bottom of a DrawerContent, pushed to the panel's end and stacking its actions. */
function DrawerFooter({ className, ...props }: DrawerFooterProps): ReactNode {
  return <View className={cn('mt-auto shrink-0 flex-col cn-drawer-footer-base', className)} {...props} />;
}

type DrawerTitleProps = ComponentProps<typeof Text>;

/** The Drawer's heading, which names its content. */
function DrawerTitle({ className, ...props }: DrawerTitleProps): ReactNode {
  const { titleId } = useContext(DrawerContext);
  const classes = cn('cn-drawer-title/text', className);
  if (Platform.OS === 'web') {
    return (
      <DrawerPrimitive.Title asChild>
        <Text role="heading" className={classes} {...props} />
      </DrawerPrimitive.Title>
    );
  }
  return <Text role="heading" nativeID={titleId} className={classes} {...props} />;
}

type DrawerDescriptionProps = ComponentProps<typeof Text>;

/** The muted text under a DrawerTitle saying what the Drawer is for; on the web it describes the content. */
function DrawerDescription({ className, ...props }: DrawerDescriptionProps): ReactNode {
  const text = <Text className={cn('cn-drawer-description/text', className)} {...props} />;
  return Platform.OS === 'web' ? <DrawerPrimitive.Description asChild>{text}</DrawerPrimitive.Description> : text;
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerSwipeHandle,
  DrawerTitle,
  DrawerTrigger,
};
export type {
  DrawerCloseProps,
  DrawerContentProps,
  DrawerDescriptionProps,
  DrawerFooterProps,
  DrawerHeaderProps,
  DrawerOverlayProps,
  DrawerPortalProps,
  DrawerProps,
  DrawerSwipeHandleProps,
  DrawerTitleProps,
  DrawerTriggerProps,
};

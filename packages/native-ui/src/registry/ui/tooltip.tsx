import * as TooltipPrimitive from '@rn-primitives/tooltip';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle } from 'react-native-reanimated';
import { usePresence } from '../lib/motion';
import { usePortalHostCheck } from '../lib/overlay';
import { cn } from '../lib/utils';
import { TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes, and
// `cn-<slot>@<state>` for the classes the style puts behind that state; the registry build replaces each
// with the classes translated for the target engine.

/** Upstream's 150ms fade, zoom from 95% and 0.5rem slide in from the trigger's side. */
const TOOLTIP_MOTION = { duration: 150, easing: Easing.bezier(0.25, 0.1, 0.25, 1) } as const;

/** Upstream's `slide-in-from-*-2`, the 0.5rem the content slides in by, in px at the theme's 16px rem. */
const TOOLTIP_SLIDE = 8;

/** How long the pointer rests on a trigger outside a TooltipProvider before the web opens its tooltip. */
const TOOLTIP_DEFAULT_DELAY = 600;

type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

/** The content grows out of the edge that faces its trigger. */
const TRANSFORM_ORIGIN: Readonly<Record<TooltipSide, string>> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

/** The delay a TooltipProvider sets for the tooltips inside it. */
const TooltipDelayContext = createContext(TOOLTIP_DEFAULT_DELAY);

/** Whether the Tooltip is open, which its primitive keeps to itself. */
const TooltipOpenContext = createContext(false);

interface TooltipProviderProps {
  /** How long, in ms, the pointer rests on a trigger before the web opens its tooltip. */
  delay?: number;
  children?: ReactNode;
}

/**
 * Sets how long the pointer rests on a trigger before the web opens its tooltip, for every Tooltip inside
 * it: at once by default. On a device a press opens a tooltip, and the delay does nothing.
 */
function TooltipProvider({ delay = 0, children }: TooltipProviderProps): ReactNode {
  return <TooltipDelayContext.Provider value={delay}>{children}</TooltipDelayContext.Provider>;
}

type TooltipProps = Omit<TooltipPrimitive.RootProps, 'delayDuration' | 'skipDelayDuration'>;

/**
 * A short label for a control, shown beside it. On the web it opens while the pointer rests on its trigger
 * or the trigger has focus; on a device, when the trigger is pressed. Holds a TooltipTrigger and a
 * TooltipContent.
 */
function Tooltip({ onOpenChange, children, ...props }: TooltipProps): ReactNode {
  const delay = useContext(TooltipDelayContext);
  const [open, setOpen] = useState(false);
  return (
    <TooltipOpenContext.Provider value={open}>
      <TooltipPrimitive.Root
        delayDuration={delay}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
        {...props}
      >
        {children}
      </TooltipPrimitive.Root>
    </TooltipOpenContext.Provider>
  );
}

type TooltipTriggerProps = TooltipPrimitive.TriggerProps;

/** Opens the Tooltip; pass `asChild` to make a Button the trigger. Focus returns here on close. */
function TooltipTrigger(props: TooltipTriggerProps): ReactNode {
  return <TooltipPrimitive.Trigger {...props} />;
}

type TooltipContentProps = Omit<TooltipPrimitive.ContentProps, 'side' | 'insets' | 'disablePositioningStyle'> & {
  /**
   * The side of the trigger the content opens on. On a device it opens above or below the trigger, so
   * `left` and `right` open it above.
   */
  side?: TooltipSide;
  /** The `name` of the PortalHost to draw in, when it is not the app's own. */
  portalHost?: string;
};

/**
 * The label itself, drawn beside its trigger, 4px above it and centred on it by default, in the
 * foreground colour. It is announced as a `tooltip`. On a device accessibility focus moves into it as it
 * opens; a press outside it, the Android back button and the iOS escape gesture close it. On the web the
 * pointer leaving the trigger and Escape close it. It fades in while growing from 95% and sliding 0.5rem
 * away from the trigger over 150ms, or appears at once when the system asks for reduced motion.
 */
function TooltipContent({
  className,
  children,
  align = 'center',
  alignOffset = 0,
  side = 'top',
  sideOffset = 4,
  portalHost,
  ...props
}: TooltipContentProps): ReactNode {
  const open = useContext(TooltipOpenContext);
  const { present, progress, reduced } = usePresence(open, TOOLTIP_MOTION);
  // The primitive places the content above or below its trigger on a device; the web's places it on any side.
  const placed = Platform.OS === 'web' || side === 'bottom' ? side : 'top';
  const motion = useAnimatedStyle(() => {
    const offset = (1 - progress.value) * TOOLTIP_SLIDE;
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

  const hostCheck = usePortalHostCheck(present, 'Tooltip', portalHost);

  if (!present) return null;

  const content = (
    <TooltipPrimitive.Content
      forceMount
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    >
      <TextClassContext.Provider value="text-background cn-tooltip-content/text">
        {/* Not every engine styles an Animated.View by its className, so the box is a View inside it. */}
        <Animated.View style={[{ transformOrigin: TRANSFORM_ORIGIN[placed] }, !reduced && motion]}>
          <View className={cn('max-w-xs bg-foreground cn-tooltip-content', className)}>{children}</View>
        </Animated.View>
      </TextClassContext.Provider>
    </TooltipPrimitive.Content>
  );

  return (
    <TooltipPrimitive.Portal hostName={portalHost} forceMount>
      {/* The web's portal slots its one child into the page, where Radix places the tooltip and closes it as the
          pointer leaves; a device draws the tooltip in a full-screen layer of its own. */}
      {Platform.OS === 'web' ? (
        content
      ) : (
        // The portal draws outside this tree, so whether the Tooltip is open is handed in again.
        <TooltipOpenContext.Provider value={open}>
          {/* Closing, it lets presses through to the screen while it fades. */}
          <View style={[StyleSheet.absoluteFill, { pointerEvents: open ? 'box-none' : 'none' }]}>
            {hostCheck}
            {/* A press outside the content lands here. */}
            <TooltipPrimitive.Overlay style={StyleSheet.absoluteFill} />
            {content}
          </View>
        </TooltipOpenContext.Provider>
      )}
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
export type { TooltipContentProps, TooltipProps, TooltipProviderProps, TooltipTriggerProps };

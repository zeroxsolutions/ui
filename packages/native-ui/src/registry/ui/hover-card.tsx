import * as HoverCardPrimitive from '@rn-primitives/hover-card';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle } from 'react-native-reanimated';
import { usePresence } from '../lib/motion';
import { cn } from '../lib/utils';
import { TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes, and
// `cn-<slot>@<state>` for the classes the style puts behind that state; the registry build replaces each
// with the classes translated for the target engine.

/** Upstream's 100ms fade, zoom from 95% and 0.5rem slide in from the trigger's side. */
const HOVER_CARD_MOTION = { duration: 100, easing: Easing.bezier(0.25, 0.1, 0.25, 1) } as const;

/** Upstream's `slide-in-from-*-2`, the 0.5rem the content slides in by, in px at the theme's 16px rem. */
const HOVER_CARD_SLIDE = 8;

type HoverCardSide = 'top' | 'right' | 'bottom' | 'left';

/** The content grows out of the edge that faces its trigger. */
const TRANSFORM_ORIGIN: Readonly<Record<HoverCardSide, string>> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

type HoverCardProps = HoverCardPrimitive.RootProps;

/**
 * A preview of what a link leads to, shown beside it. On the web it opens while the pointer rests on its
 * trigger, after `openDelay` ms (600 by default), and closes `closeDelay` ms (300) after the pointer leaves
 * both; on a device, when the trigger is pressed. Holds a HoverCardTrigger and a HoverCardContent.
 */
function HoverCard({ openDelay = 600, closeDelay = 300, ...props }: HoverCardProps): ReactNode {
  return <HoverCardPrimitive.Root openDelay={openDelay} closeDelay={closeDelay} {...props} />;
}

type HoverCardTriggerProps = HoverCardPrimitive.TriggerProps;

/** Opens the HoverCard; pass `asChild` to make a Button the trigger. On a device focus returns here on close. */
function HoverCardTrigger(props: HoverCardTriggerProps): ReactNode {
  return <HoverCardPrimitive.Trigger {...props} />;
}

type HoverCardContentProps = Omit<HoverCardPrimitive.ContentProps, 'side' | 'insets' | 'disablePositioningStyle'> & {
  /**
   * The side of the trigger the content opens on. On a device it opens above or below the trigger, so
   * `left` and `right` open it below.
   */
  side?: HoverCardSide;
  /** The `name` of the PortalHost to draw in, when it is not the app's own. */
  portalHost?: string;
};

/**
 * The card itself, drawn beside its trigger, 4px below it and centred on it by default. On a device it is
 * announced as a `dialog`, accessibility focus moves into it as it opens, and a press outside it, the
 * Android back button and the iOS escape gesture close it. On the web the pointer leaving it and its
 * trigger, and Escape, close it. It fades in while growing from 95% and sliding 0.5rem away from the
 * trigger over 100ms, and out the same way, or appears and goes at once when the system asks for reduced
 * motion.
 */
function HoverCardContent({
  className,
  children,
  align = 'center',
  alignOffset = 4,
  side = 'bottom',
  sideOffset = 4,
  portalHost,
  ...props
}: HoverCardContentProps): ReactNode {
  const { open, onOpenChange } = HoverCardPrimitive.useRootContext();
  const { present, progress, reduced } = usePresence(open, HOVER_CARD_MOTION);
  // The primitive places the content above or below its trigger on a device; the web's places it on any side.
  const placed = Platform.OS === 'web' || side === 'top' ? side : 'bottom';
  const motion = useAnimatedStyle(() => {
    const offset = (1 - progress.value) * HOVER_CARD_SLIDE;
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

  if (!present) return null;

  const content = (
    <HoverCardPrimitive.Content
      forceMount
      align={align}
      alignOffset={alignOffset}
      // The web's primitive takes every side, though its type names only the two a device's takes.
      side={side as HoverCardPrimitive.ContentProps['side']}
      sideOffset={sideOffset}
      {...props}
    >
      <TextClassContext.Provider value="cn-hover-card-content/text">
        {/* Not every engine styles an Animated.View by its className, so the box is a View inside it. */}
        <Animated.View style={[{ transformOrigin: TRANSFORM_ORIGIN[placed] }, !reduced && motion]}>
          <View className={cn('cn-hover-card-content', className)}>{children}</View>
        </Animated.View>
      </TextClassContext.Provider>
    </HoverCardPrimitive.Content>
  );

  return (
    <HoverCardPrimitive.Portal hostName={portalHost} forceMount>
      {Platform.OS === 'web' ? (
        // The web's portal merges its own props into its child, and over a full-screen layer it drops the
        // layer's pass-through of the pointer, which then leaves the trigger and closes the card.
        content
      ) : (
        // Closing, it lets presses through to the screen while it fades.
        <View style={[StyleSheet.absoluteFill, { pointerEvents: open ? 'box-none' : 'none' }]}>
          {/* A press outside the content lands here. It closes through the open state alone: the
              primitive's own close forgets where the trigger is, which removes the content before it can
              go out. */}
          <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={() => onOpenChange(false)} />
          {content}
        </View>
      )}
    </HoverCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardContent, HoverCardTrigger };
export type { HoverCardContentProps, HoverCardProps, HoverCardTriggerProps };

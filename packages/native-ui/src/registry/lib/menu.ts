/**
 * What the menus share: the highlight an item draws while a pointer, a key or a finger is on it, the
 * motion their content opens and closes with, and the height their items scroll past on a device.
 */
import { useState } from 'react';
import type { ComponentProps } from 'react';
import { useWindowDimensions, type PressableProps } from 'react-native';
import Animated, { Easing, useAnimatedStyle } from 'react-native-reanimated';
import { usePresence } from './motion';

/** The events of a Pressable that start and end a highlight. */
type HighlightEvents = Pick<
  PressableProps,
  'onPressIn' | 'onPressOut' | 'onHoverIn' | 'onHoverOut' | 'onFocus' | 'onBlur'
>;

/** What {@link useHighlight} gives back. */
interface Highlight {
  /** Whether a finger is down on the item, a pointer is over it or it holds the focus. */
  highlighted: boolean;
  /** The caller's own handlers, each also tracking the highlight; spread them onto the Pressable. */
  handlers: HighlightEvents;
}

/**
 * Tracks whether an item is highlighted, the state upstream's styles draw under `focus` or
 * `data-highlighted`: while a finger is down on it on a device, and while the pointer is over it or it holds
 * the keyboard's focus on the web.
 * @param events - the item's own handlers of those events, which still run
 */
function useHighlight(events: HighlightEvents): Highlight {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return {
    highlighted: pressed || hovered || focused,
    handlers: {
      onPressIn: (event) => {
        setPressed(true);
        events.onPressIn?.(event);
      },
      onPressOut: (event) => {
        setPressed(false);
        events.onPressOut?.(event);
      },
      onHoverIn: (event) => {
        setHovered(true);
        events.onHoverIn?.(event);
      },
      onHoverOut: (event) => {
        setHovered(false);
        events.onHoverOut?.(event);
      },
      onFocus: (event) => {
        setFocused(true);
        events.onFocus?.(event);
      },
      onBlur: (event) => {
        setFocused(false);
        events.onBlur?.(event);
      },
    },
  };
}

/** Upstream's 100ms fade, zoom from 95% and 0.5rem slide in from the trigger's side. */
const MENU_MOTION = {
  duration: 100,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
} as const;

/** Upstream's `slide-in-from-*-2`, the 0.5rem the content slides in by, in px at the theme's 16px rem. */
const MENU_SLIDE = 8;

/** The side of its trigger a menu's content opens on. */
type MenuSide = 'top' | 'right' | 'bottom' | 'left';

/** The content grows out of the edge that faces its trigger. */
const TRANSFORM_ORIGIN: Readonly<Record<MenuSide, string>> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

/** What {@link useMenuMotion} gives back. */
interface MenuMotion {
  /** Whether the content is drawn: while it is open, and while it goes out after closing. */
  present: boolean;
  /** The style of the animated layer around the content's box. */
  style: ComponentProps<typeof Animated.View>['style'];
}

/**
 * The motion of a menu's content opening on `side` of its trigger: it fades in while growing from 95% and
 * sliding 0.5rem away from the trigger over 100ms, and out the same way, or appears and goes at once when
 * the system asks for reduced motion.
 */
function useMenuMotion(open: boolean, side: MenuSide): MenuMotion {
  const { present, progress, reduced } = usePresence(open, MENU_MOTION);
  const motion = useAnimatedStyle(() => {
    const offset = (1 - progress.value) * MENU_SLIDE;
    return {
      opacity: progress.value,
      transform: [
        side === 'top' || side === 'bottom'
          ? { translateY: side === 'top' ? offset : -offset }
          : { translateX: side === 'left' ? offset : -offset },
        { scale: 0.95 + progress.value * 0.05 },
      ],
    };
  });
  return {
    present,
    style: [{ transformOrigin: TRANSFORM_ORIGIN[side] }, !reduced && motion],
  };
}

/** How far in from the screen's top and bottom edges a menu's items stop, in px. */
const MENU_SCREEN_MARGIN = 16;

/**
 * The tallest a menu's items are drawn on a device before they scroll: the window's height less a margin at
 * each edge. The primitive moves content that would pass the screen's bottom up onto it, so the whole height
 * is room.
 */
function useMenuScrollHeight(): number {
  return useWindowDimensions().height - 2 * MENU_SCREEN_MARGIN;
}

export { useHighlight, useMenuMotion, useMenuScrollHeight };
export type { Highlight, MenuMotion, MenuSide };

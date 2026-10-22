/**
 * What the menus share: the highlight an item draws while a pointer, a key or a finger is on it, what
 * pressing an item does to its menu, an item's role on the web, and the height items scroll past on a device.
 */
import { useState } from 'react';
import {
  Platform,
  useWindowDimensions,
  type GestureResponderEvent,
  type PressableProps,
  type Role,
} from 'react-native';

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

/** What pressing an item does to its menu, as props for the primitive's item. */
interface PressClosing {
  closeOnPress: boolean;
  onPress: (event: GestureResponderEvent) => void;
}

/**
 * What pressing an item does: runs `onPress`, then closes the menu through `close` unless `closeOnClick` is
 * false. On a device the menu closes through its open state alone, so it can go out; the web's primitive
 * closes it itself.
 */
function pressClosing(
  closeOnClick: boolean,
  onPress: ((event: GestureResponderEvent) => void) | undefined,
  close: () => void,
): PressClosing {
  return {
    closeOnPress: Platform.OS === 'web' ? closeOnClick : false,
    onPress: (event) => {
      onPress?.(event);
      if (closeOnClick && Platform.OS !== 'web') close();
    },
  };
}

/**
 * The role an item takes on the web, where the primitive draws an item as a `button` inside Radix's menu. A
 * device has no checkbox or radio menu item role, so there the primitive's `checkbox` or `radio` stands,
 * which announces the checked state.
 */
function webItemRole(role: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio'): { role?: Role } {
  return Platform.OS === 'web' ? { role: role as Role } : {};
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

export { pressClosing, useHighlight, useMenuScrollHeight, webItemRole };
export type { Highlight, PressClosing };

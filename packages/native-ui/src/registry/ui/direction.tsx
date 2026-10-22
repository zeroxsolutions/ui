import { createContext, useContext, type ComponentType, type ReactNode } from 'react';
import { I18nManager, Platform, View, type ViewProps, type ViewStyle } from 'react-native';

/** The direction text reads in, and so the side a row starts from. */
type TextDirection = 'ltr' | 'rtl';

const DirectionContext = createContext<TextDirection | undefined>(undefined);

/** The web's View, which takes the page's `dir`; React Native's types leave the prop out. */
const WebView = View as ComponentType<ViewProps & { dir: TextDirection }>;

/** The direction the system lays the app out in, which only an app restart changes on a device. */
function systemDirection(): TextDirection {
  return I18nManager.getConstants().isRTL ? 'rtl' : 'ltr';
}

interface DirectionProviderProps {
  /** The direction the parts inside read; the system's, from I18nManager, when left out. */
  direction?: TextDirection;
  children?: ReactNode;
}

/**
 * Tells the parts inside it which direction text reads in, for the ones that draw an arrow, a side or a
 * swipe. On the web it also sets `dir` on a box around its children that adds no layout of its own, so
 * the page lays them out in that direction. A device lays out the whole app in the system's direction,
 * which I18nManager sets for the app's life, so there it draws nothing around them.
 */
function DirectionProvider({ direction, children }: DirectionProviderProps): ReactNode {
  const value = direction ?? systemDirection();
  return (
    <DirectionContext.Provider value={value}>
      {Platform.OS === 'web' ? (
        <WebView dir={value} style={{ display: 'contents' }}>
          {children}
        </WebView>
      ) : (
        children
      )}
    </DirectionContext.Provider>
  );
}

/** The direction of the nearest DirectionProvider, or the system's outside one. */
function useDirection(): TextDirection {
  return useContext(DirectionContext) ?? systemDirection();
}

/** Where an item that places or moves something itself finds its sides. */
interface DirectionSides {
  /** Whether the item's arrows, keys and own tracks run right to left: the nearest provider's direction. */
  rtl: boolean;
  /**
   * The direction the platform lays out rows and `start` and `end` styles in around the item: the provider's
   * on the web, where it sets `dir`, and the system's on a device, where a provider changes no layout.
   */
  layout: TextDirection;
  /**
   * The style keys that put a child at the side the item starts from and the side it ends at, in `rtl`'s
   * direction: `start` and `end` where the layout runs the same way, swapped where it does not.
   */
  start: 'start' | 'end';
  end: 'start' | 'end';
  /**
   * Whether `left` and `right` styles are drawn swapped: on a device laid out right to left, unless the app
   * called `I18nManager.swapLeftAndRightInRTL(false)`. The web keeps them where named.
   */
  sidesSwapped: boolean;
}

/**
 * Which way an item runs and how it reaches its sides. A device lays out in the system's direction whatever a
 * provider says, so an item that runs the provider's way places its own parts with `start` and `end` from here.
 */
function useDirectionSides(): DirectionSides {
  const direction = useDirection();
  const web = Platform.OS === 'web';
  const layout = web ? direction : systemDirection();
  const agrees = layout === direction;
  return {
    rtl: direction === 'rtl',
    layout,
    start: agrees ? 'start' : 'end',
    end: agrees ? 'end' : 'start',
    sidesSwapped: !web && layout === 'rtl' && I18nManager.getConstants().doLeftAndRightSwapInRTL,
  };
}

const MIRRORED: ViewStyle = { transform: [{ scaleX: -1 }] };

/** The style that turns an arrow drawn for text read left to right the other way when text reads right to left. */
function useMirrored(): ViewStyle | undefined {
  return useDirection() === 'rtl' ? MIRRORED : undefined;
}

export { DirectionProvider, useDirection, useDirectionSides, useMirrored };
export type { DirectionProviderProps, DirectionSides, TextDirection };

import { createContext, useContext, type ComponentType, type ReactNode } from 'react';
import { I18nManager, Platform, View, type ViewProps } from 'react-native';

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

/**
 * Whether a device draws `left` and `right` styles swapped, for a part that moves toward the side it is drawn
 * on: React Native lays out an app whose text reads right to left with each `left` style on the right, unless
 * the app turned that off with `I18nManager.swapLeftAndRightInRTL(false)`. The web keeps them where named.
 */
function useSidesSwapped(): boolean {
  const rtl = useDirection() === 'rtl';
  return Platform.OS !== 'web' && rtl && I18nManager.getConstants().doLeftAndRightSwapInRTL;
}

export { DirectionProvider, useDirection, useSidesSwapped };
export type { DirectionProviderProps, TextDirection };

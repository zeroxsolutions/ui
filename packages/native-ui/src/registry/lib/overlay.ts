/**
 * What the overlays share beyond their motion: a check, while developing, that a PortalHost draws them.
 */
import { createElement, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Platform } from 'react-native';

/** How long a shown overlay waits for a PortalHost to draw it before reporting that none did. */
const PORTAL_HOST_WAIT = 500;

/** Calls `onDrawn` once it is drawn: inside a Portal, only when a PortalHost draws the Portal's children. */
function PortalHostProbe({ onDrawn }: { onDrawn: () => void }): ReactNode {
  useEffect(onDrawn, [onDrawn]);
  return null;
}

/**
 * Reports, through `console.error` in development, an overlay that is shown while no PortalHost draws it,
 * which otherwise opens and draws nothing. A Portal only hands its children to a host, and none says when
 * no host takes them. Each time `shown` turns true it waits half a second for the returned probe to be
 * drawn. On the web the primitives draw into the page itself and need no host, so it checks nothing there.
 * @param part - the overlay's name, such as `Dialog`, which the report names
 * @param hostName - the `name` of the PortalHost the overlay asked for, when it is not the app's own
 * @returns the probe, to draw among the Portal's children
 */
function usePortalHostCheck(shown: boolean, part: string, hostName?: string): ReactNode {
  const drawn = useRef(false);
  const onDrawn = useCallback(() => {
    drawn.current = true;
  }, []);

  useEffect(() => {
    if (!__DEV__ || Platform.OS === 'web' || !shown) return;
    drawn.current = false;
    const timer = setTimeout(() => {
      if (drawn.current) return;
      const host = hostName === undefined ? '<PortalHost />' : `<PortalHost name="${hostName}" />`;
      console.error(
        `${part} opened, but no ${host} drew it, so nothing is shown. Render ${host} from @rn-primitives/portal ` +
          "once, as the last child of the app's root (app/_layout.tsx in Expo Router); see " +
          '/native/docs/installation#add-a-portal-host.',
      );
    }, PORTAL_HOST_WAIT);
    return () => clearTimeout(timer);
  }, [shown, part, hostName]);

  return createElement(PortalHostProbe, { onDrawn });
}

export { usePortalHostCheck };

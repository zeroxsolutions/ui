/**
 * What the overlays share beyond their motion: a check, while developing, that a PortalHost draws them, and
 * the screen readers' view of a modal overlay and the screen behind it.
 */
import { createElement, useCallback, useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
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

/** How many modal overlays are shown, across the app, and who to tell when that changes. */
let modalOverlays = 0;
const modalListeners = new Set<() => void>();

function subscribeToModalOverlays(listener: () => void): () => void {
  modalListeners.add(listener);
  return () => modalListeners.delete(listener);
}

function changeModalOverlays(by: number): void {
  modalOverlays += by;
  for (const listener of modalListeners) listener();
}

/**
 * Whether any modal overlay, such as a Dialog or a Sheet, is shown. While one is, hide the app's screens
 * from screen readers, as Android's TalkBack otherwise reads on past the overlay into the screen behind:
 * pass it as `aria-hidden` to the View around them, beside the PortalHost.
 */
function useModalOverlayShown(): boolean {
  return useSyncExternalStore(
    subscribeToModalOverlays,
    () => modalOverlays > 0,
    () => false,
  );
}

/** The props of a modal overlay's outermost layer, drawn as a sibling of the app's screens. */
interface ModalLayerProps {
  /** Keeps iOS VoiceOver inside the layer by hiding its siblings, the app's screens. */
  accessibilityViewIsModal?: boolean;
}

/**
 * Counts the overlay as shown for {@link useModalOverlayShown} while `shown`, and gives the props of its
 * outermost layer, which make the layer modal for iOS VoiceOver. The web's primitives hide the rest of the
 * page themselves, so on the web the layer takes none.
 */
function useModalOverlay(shown: boolean): ModalLayerProps {
  useEffect(() => {
    if (!shown) return;
    changeModalOverlays(1);
    return () => changeModalOverlays(-1);
  }, [shown]);
  return Platform.OS === 'web' ? {} : { accessibilityViewIsModal: true };
}

export { useModalOverlay, useModalOverlayShown, usePortalHostCheck };
export type { ModalLayerProps };

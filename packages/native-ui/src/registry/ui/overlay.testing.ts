/**
 * Helpers the overlay specs share for what Jest's renderer does not do as a device does: deliver the
 * Android back button, tell which view accessibility focus was moved to, and drag a finger across a view.
 */
import { act, type screen } from '@testing-library/react-native';
import { createElement, type ReactElement } from 'react';
import type * as ReactNative from 'react-native';
import { BackHandler, type NativeEventSubscription } from 'react-native';
import { AccessibilityInfo, View } from 'react-native';
import { useModalOverlayShown } from '../lib/overlay';

/**
 * Catches the listeners an overlay adds for the Android back button; call before rendering it.
 * @returns a press of the back button, which resolves to whether the newest listener took it
 */
function catchBackPress(): () => Promise<boolean | undefined> {
  const handlers: Parameters<typeof BackHandler.addEventListener>[1][] = [];
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler): NativeEventSubscription => {
    handlers.push(handler);
    return { remove: () => undefined };
  });
  return async () => {
    let handled: boolean | undefined;
    await act(async () => {
      handled = handlers.at(-1)?.({ type: 'hardwareBackPress', timeStamp: 0 });
    });
    return handled;
  };
}

/**
 * Follows where the overlay's primitives move accessibility focus; call before rendering. Jest's renderer
 * has no native tags, so each view is given one, which the primitives focus a view by.
 * @returns the `testID` of the view focus was last moved to, `undefined` before any move
 */
function followAccessibilityFocus(): () => string | undefined {
  const views: unknown[] = [];
  const tagOf: typeof ReactNative.findNodeHandle = (view) =>
    views.includes(view) ? views.indexOf(view) : views.push(view) - 1;
  // react-native exports findNodeHandle through a getter, which a spy replaces only as a property.
  jest
    .spyOn(jest.requireActual<{ findNodeHandle: unknown }>('react-native'), 'findNodeHandle', 'get')
    .mockReturnValue(tagOf);
  const focus = jest.spyOn(AccessibilityInfo, 'setAccessibilityFocus');
  return () => (views[focus.mock.lastCall?.[0] ?? -1] as { props: { testID?: string } } | undefined)?.props.testID;
}

/** A finger's position, in px, at a time, in ms. */
interface TouchPoint {
  x: number;
  y: number;
  t: number;
}

/** The responder system's record of one finger that went down at `start` and is now at `now`. */
function touchHistoryOf(start: TouchPoint, now: TouchPoint, down: boolean) {
  return {
    numberActiveTouches: down ? 1 : 0,
    indexOfSingleActiveTouch: 0,
    mostRecentTimeStamp: now.t,
    touchBank: [
      {
        touchActive: down,
        startPageX: start.x,
        startPageY: start.y,
        startTimeStamp: start.t,
        currentPageX: now.x,
        currentPageY: now.y,
        currentTimeStamp: now.t,
        previousPageX: start.x,
        previousPageY: start.y,
        previousTimeStamp: start.t,
      },
    ],
  };
}

/**
 * Drags one finger across the view whose PanResponder handles it, by `dx` and `dy` px over `ms`, then
 * lifts it, calling the view's responder handlers as the responder system does once the view has taken
 * the touch. RNTL's fireEvent asks the view whether it takes a move with no touch to judge it by, which a
 * PanResponder declines.
 */
async function swipe(view: { props: Record<string, unknown> }, { dx = 0, dy = 0, ms = 400 }): Promise<void> {
  const start = { x: 200, y: 400, t: 1_000 };
  const end = { x: start.x + dx, y: start.y + dy, t: start.t + ms };
  const handle = (name: string, touchHistory: ReturnType<typeof touchHistoryOf>) =>
    act(async () => {
      (view.props[name] as (event: unknown) => void)({ touchHistory, nativeEvent: {} });
    });
  // The first move a PanResponder sees times itself from no move at all, as on a device.
  const first = { ...start, t: start.t + 1 };
  await handle('onResponderGrant', touchHistoryOf(start, start, true));
  await handle('onResponderMove', touchHistoryOf(start, first, true));
  await handle('onResponderMove', touchHistoryOf(first, end, true));
  await handle('onResponderRelease', touchHistoryOf(start, end, false));
}

export { AppScreen, outermostView, catchBackPress, followAccessibilityFocus, swipe };

type HostView = ReturnType<typeof screen.getByTestId>;

/**
 * The app's screen as the install docs have an app draw it, beside the PortalHost: hidden from screen
 * readers while a modal overlay is shown. Its `testID` is `app-screen`.
 */
function AppScreen(): ReactElement {
  return createElement(View, { testID: 'app-screen', 'aria-hidden': useModalOverlayShown() });
}

/** The outermost view an overlay drew around `view`: the one its PortalHost holds beside the app's screen. */
function outermostView(view: HostView): HostView {
  let outer = view;
  while (outer.parent !== null && outer.parent.parent !== null) outer = outer.parent;
  return outer;
}

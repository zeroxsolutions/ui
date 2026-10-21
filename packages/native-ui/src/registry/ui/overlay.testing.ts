/**
 * Helpers the overlay specs share for what Jest's renderer does not do as a device does: deliver the
 * Android back button, and tell which view accessibility focus was moved to.
 */
import { act } from '@testing-library/react-native';
import type * as ReactNative from 'react-native';
import { BackHandler, type NativeEventSubscription } from 'react-native';
import { AccessibilityInfo } from 'react-native';

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

export { catchBackPress, followAccessibilityFocus };

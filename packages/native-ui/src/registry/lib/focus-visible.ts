import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

/** What {@link useFocusVisible} gives back. */
interface FocusVisible {
  /** Whether the control holds focus that came from the keyboard, which a focus ring is drawn for. */
  focusVisible: boolean;
  /** Call from the control's `onFocus` with its event. */
  onFocus: (event: unknown) => void;
  /** Call from the control's `onBlur`. */
  onBlur: () => void;
}

/** A focus event's target, which is the DOM element on the web. */
interface FocusTarget {
  matches?: (selector: string) => boolean;
}

/**
 * Whether a control's focus came from the keyboard, as the web's `:focus-visible` says, so a focus ring is drawn
 * for it and not after a press. On the web the browser decides, from the focused element; a mouse press focuses
 * an element before its press handlers run, so no press flag can. On a device a touch never focuses a control,
 * so any focus is a keyboard's.
 */
function useFocusVisible(): FocusVisible {
  const [focusVisible, setFocusVisible] = useState(false);
  const onFocus = useCallback((event: unknown) => {
    if (Platform.OS !== 'web') {
      setFocusVisible(true);
      return;
    }
    const { target, nativeEvent } = (event ?? {}) as { target?: FocusTarget; nativeEvent?: { target?: FocusTarget } };
    const element = nativeEvent?.target ?? target;
    setFocusVisible(element?.matches?.(':focus-visible') === true);
  }, []);
  const onBlur = useCallback(() => setFocusVisible(false), []);
  return { focusVisible, onFocus, onBlur };
}

export { useFocusVisible };
export type { FocusVisible };

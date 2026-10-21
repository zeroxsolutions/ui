/**
 * The motion the overlays share: whether the system asks for reduced motion, and a presence that keeps a
 * part drawn while it animates in and out.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useSharedValue, withTiming, type SharedValue, type WithTimingConfig } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

/** Whether the system asks for less motion, kept up to date while the component is mounted; false until read. */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduced(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

/** What {@link usePresence} gives back. */
interface Presence {
  /** Whether the part is drawn: while it is open, and while it goes out after closing. */
  present: boolean;
  /** How far the part has come in, from 0, gone, to 1, fully in; drive its animated style from it. */
  progress: SharedValue<number>;
  /**
   * Whether the system asks for reduced motion, when the part is drawn still, without its animated style.
   * A portal mounts the part a render after it opens, after `progress` was set, so a still part relies on
   * no value reaching a view attached that late.
   */
  reduced: boolean;
}

/**
 * Keeps a part that shows while `open`, such as a dialog, drawn while it animates. As it opens, `progress`
 * runs from 0 to 1 over `enter`; as it closes, back to 0 over `exit`, after which `present` turns false.
 * A part open from the start comes in too. When the system asks for reduced motion, a closed part is
 * removed at once, and `reduced` says to draw it without its animated style.
 * @param enter - the timing of the way in; pass a constant, since a new object restarts the animation
 * @param exit - the timing of the way out, `enter` when left out
 */
function usePresence(open: boolean, enter: WithTimingConfig, exit: WithTimingConfig = enter): Presence {
  const reduced = useReducedMotion();
  const [present, setPresent] = useState(open);
  const progress = useSharedValue(0);

  useEffect(() => {
    const target = open ? 1 : 0;
    if (open) setPresent(true);
    if (reduced) {
      progress.value = target;
      if (!open) setPresent(false);
      return;
    }
    progress.value = withTiming(target, open ? enter : exit, (finished) => {
      if (finished === true && target === 0) scheduleOnRN(setPresent, false);
    });
  }, [open, reduced, enter, exit, progress]);

  return { present: present || open, progress, reduced };
}

export { usePresence, useReducedMotion };
export type { Presence };

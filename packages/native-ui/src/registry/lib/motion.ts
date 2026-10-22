/**
 * The motion the overlays share: whether the system asks for reduced motion, a presence that keeps a part
 * drawn while it animates in and out, and the fade, grow and slide a popup beside its trigger moves with.
 */
import { useEffect, useState, type ComponentProps } from 'react';
import { AccessibilityInfo } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion as useSettingAtStart,
  useSharedValue,
  withTiming,
  type SharedValue,
  type WithTimingConfig,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

/**
 * Whether the system asks for less motion, kept up to date while the component is mounted. The first render
 * already holds the setting as of app start, so a part open from the start never draws a frame of motion.
 */
function useReducedMotion(): boolean {
  const atStart = useSettingAtStart();
  const [reduced, setReduced] = useState(atStart);
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

/** Upstream's 100ms popup motion, on tw-animate's default `ease`. */
const POPUP_MOTION = { duration: 100, easing: Easing.bezier(0.25, 0.1, 0.25, 1) } as const;

/** Upstream's `slide-in-from-*-2`, the 0.5rem a popup slides in by, in px at the theme's 16px rem. */
const POPUP_SLIDE = 8;

/** The side of its trigger a popup, such as a menu, a popover or a tooltip, opens on. */
type PopupSide = 'top' | 'right' | 'bottom' | 'left';

/** A popup grows out of the edge that faces its trigger. */
const TRANSFORM_ORIGIN: Readonly<Record<PopupSide, string>> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

/** What {@link usePopupMotion} gives back. */
interface PopupMotion {
  /** Whether the popup is drawn: while it is open, and while it goes out after closing. */
  present: boolean;
  /** The style of the animated layer around the popup's box. */
  style: ComponentProps<typeof Animated.View>['style'];
}

/**
 * The motion of a popup opening on `side` of its trigger: it fades in while growing from 95% and sliding
 * 0.5rem away from the trigger, and out the same way, or appears and goes at once when the system asks for
 * reduced motion.
 * @param timing - how long it takes, 100ms by default; pass a constant, since a new object restarts it
 */
function usePopupMotion(open: boolean, side: PopupSide, timing: WithTimingConfig = POPUP_MOTION): PopupMotion {
  const { present, progress, reduced } = usePresence(open, timing);
  const motion = useAnimatedStyle(() => {
    const offset = (1 - progress.value) * POPUP_SLIDE;
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
  return { present, style: [{ transformOrigin: TRANSFORM_ORIGIN[side] }, !reduced && motion] };
}

export { usePopupMotion, usePresence, useReducedMotion };
export type { PopupMotion, PopupSide, Presence };

/**
 * The motion the overlays share: whether the system asks for reduced motion, a presence that keeps a part
 * drawn while it animates in and out, the fade, grow and slide a popup beside its trigger moves with, and
 * the swipe that dismisses a toast.
 */
import { useEffect, useRef, useState, type ComponentProps, type RefObject } from 'react';
import { AccessibilityInfo, Platform, type GestureResponderEvent, type GestureResponderHandlers } from 'react-native';
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
  /** Whether the part has come fully in and is open: false while it comes in, and from when it closes. */
  entered: boolean;
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
  const [entered, setEntered] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    const target = open ? 1 : 0;
    if (open) setPresent(true);
    setEntered(open && reduced);
    if (reduced) {
      progress.value = target;
      if (!open) setPresent(false);
      return;
    }
    progress.value = withTiming(target, open ? enter : exit, (finished) => {
      if (finished !== true) return;
      if (target === 0) scheduleOnRN(setPresent, false);
      else scheduleOnRN(setEntered, true);
    });
  }, [open, reduced, enter, exit, progress]);

  return { present: present || open, progress, entered: entered && open, reduced };
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
 * reduced motion. On the web it takes no pointer until it is fully in: the slide can carry it over the
 * point a held button opened it at, such as a context menu's right click, and Radix's menu turns that
 * button's release over an item into a click on the item.
 * @param timing - how long it takes, 100ms by default; pass a constant, since a new object restarts it
 */
function usePopupMotion(open: boolean, side: PopupSide, timing: WithTimingConfig = POPUP_MOTION): PopupMotion {
  const { present, progress, entered, reduced } = usePresence(open, timing);
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
  return {
    present,
    style: [
      { transformOrigin: TRANSFORM_ORIGIN[side] },
      Platform.OS === 'web' && !entered && { pointerEvents: 'none' },
      !reduced && motion,
    ],
  };
}

/** A way a finger swipes a part off the screen. */
type SwipeDirection = 'up' | 'down' | 'left' | 'right';

/** How far a swipe goes, in px, or how fast, in px per ms, to dismiss. */
const SWIPE_THRESHOLD = 45;
const SWIPE_VELOCITY = 0.11;

/** How far a finger moves, in px, before a swipe takes the touch from the part's buttons. */
const SWIPE_SLOP = 4;

interface SwipeToDismissOptions {
  /** The ways a swipe dismisses the part; a swipe any other way pulls against it and springs back. */
  directions: readonly SwipeDirection[];
  /** Whether a swipe can dismiss the part at all; when false, no swipe takes the touch. */
  enabled: boolean;
  /** Called once a swipe has gone far or fast enough one of `directions`, with that direction. */
  onDismiss: (direction: SwipeDirection) => void;
  /** The timing a short swipe springs back with; pass a constant. */
  settle: WithTimingConfig;
  /** Whether the system asks for reduced motion, when a short swipe springs back at once. */
  reduced: boolean;
}

/** What {@link useSwipeToDismiss} gives back. */
interface SwipeToDismiss {
  /** The responder handlers to spread on the view a finger swipes. */
  handlers: Pick<
    GestureResponderHandlers,
    | 'onStartShouldSetResponderCapture'
    | 'onMoveShouldSetResponderCapture'
    | 'onResponderTerminationRequest'
    | 'onResponderGrant'
    | 'onResponderMove'
    | 'onResponderRelease'
    | 'onResponderTerminate'
  >;
  /** How far the swipe in progress has moved the part across, in px; drive its translateX from it. */
  x: SharedValue<number>;
  /** How far it has moved the part down, in px; drive its translateY from it. */
  y: SharedValue<number>;
  /** The direction the swipe that dismissed the part went, for the way it goes out; unset before one. */
  swiped: RefObject<SwipeDirection | undefined>;
}

/**
 * A swipe that dismisses a part, such as a toast, on React Native's responder: the part follows the finger
 * one of `directions`, and with growing resistance any other way. Let go after 45px, or a quick flick, one
 * of `directions`, it calls `onDismiss`; otherwise it springs back. A finger that moves takes the touch from
 * the part's buttons, so a swipe that starts on one still dismisses it.
 */
function useSwipeToDismiss({ directions, enabled, onDismiss, settle, reduced }: SwipeToDismissOptions): SwipeToDismiss {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const swiped = useRef<SwipeDirection | undefined>(undefined);
  const touchStart = useRef<{ x: number; y: number } | undefined>(undefined);
  // The swipe in progress: where it started, and when, for its speed.
  const drag = useRef<{ x: number; y: number; time: number } | undefined>(undefined);
  const allowed = (direction: SwipeDirection): boolean => directions.includes(direction);
  const springBack = (): void => {
    x.value = reduced ? 0 : withTiming(0, settle);
    y.value = reduced ? 0 : withTiming(0, settle);
  };

  const handlers: SwipeToDismiss['handlers'] = {
    onStartShouldSetResponderCapture: (event: GestureResponderEvent) => {
      touchStart.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
      return false;
    },
    onMoveShouldSetResponderCapture: (event: GestureResponderEvent) => {
      const start = touchStart.current;
      if (!enabled || start === undefined) return false;
      return Math.hypot(event.nativeEvent.pageX - start.x, event.nativeEvent.pageY - start.y) > SWIPE_SLOP;
    },
    onResponderTerminationRequest: () => false,
    onResponderGrant: (event: GestureResponderEvent) => {
      drag.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY, time: event.nativeEvent.timestamp };
    },
    onResponderMove: (event: GestureResponderEvent) => {
      const start = drag.current;
      if (start === undefined) return;
      const dx = event.nativeEvent.pageX - start.x;
      const dy = event.nativeEvent.pageY - start.y;
      const resist = (delta: number): number => delta / (1.5 + Math.abs(delta) / 20);
      x.value = (dx < 0 ? allowed('left') : allowed('right')) ? dx : resist(dx);
      y.value = (dy < 0 ? allowed('up') : allowed('down')) ? dy : resist(dy);
    },
    onResponderRelease: (event: GestureResponderEvent) => {
      const start = drag.current;
      drag.current = undefined;
      if (start === undefined) return;
      const dx = event.nativeEvent.pageX - start.x;
      const dy = event.nativeEvent.pageY - start.y;
      const across = Math.abs(dx) > Math.abs(dy);
      const amount = across ? dx : dy;
      const direction: SwipeDirection = across ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
      const elapsed = Math.max(1, event.nativeEvent.timestamp - start.time);
      if (allowed(direction) && (Math.abs(amount) >= SWIPE_THRESHOLD || Math.abs(amount) / elapsed > SWIPE_VELOCITY)) {
        swiped.current = direction;
        onDismiss(direction);
        return;
      }
      springBack();
    },
    onResponderTerminate: () => {
      drag.current = undefined;
      springBack();
    },
  };

  return { handlers, x, y, swiped };
}

export { usePopupMotion, usePresence, useReducedMotion, useSwipeToDismiss };
export type { PopupMotion, PopupSide, Presence, SwipeDirection, SwipeToDismiss };

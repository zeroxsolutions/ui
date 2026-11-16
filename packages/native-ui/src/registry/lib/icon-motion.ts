/**
 * What every animated icon shares: the handle a control starts and stops it through, its props, and the
 * progress its parts are drawn from.
 */
import type { LucideProps } from 'lucide-react-native';
import { useImperativeHandle, type Ref } from 'react';
import {
  cancelAnimation,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type EasingFunction,
  type SharedValue,
  type WithSpringConfig,
} from 'react-native-reanimated';
import { useReducedMotion } from './motion';

/** What a control holds an animated icon by, to play its motion when the control is pressed or focused. */
interface IconHandle {
  /** Plays the motion once, out and back; does nothing when the system asks for reduced motion. */
  startAnimation(): void;
  /** Puts the icon back at rest at once. */
  stopAnimation(): void;
}

/** An animated icon's props: a lucide icon's, and the ref its {@link IconHandle} is handed through. */
type AnimatedIconProps = LucideProps & { ref?: Ref<IconHandle> };

/**
 * How each way of an icon's motion runs: over `duration` ms, on `easing` or Reanimated's default, or as a
 * spring, as its web twin's transition does.
 */
type IconTiming = { duration: number; easing?: EasingFunction } | { spring: WithSpringConfig };

/** Runs a value to `target` on `timing`. */
function animateTo(target: number, timing: IconTiming): number {
  return 'spring' in timing ? withSpring(target, timing.spring) : withTiming(target, timing);
}

/**
 * The progress an animated icon draws its parts from, 0 at rest and 1 at the far end of its motion, and the
 * handle `ref` receives. `startAnimation` runs it to 1 and back to 0 on `timing`; `stopAnimation` sets it to
 * 0 at once. While the system asks for reduced motion it never moves.
 * @param timing - pass a constant, since a new object hands `ref` a new handle on every render
 */
function useIconMotion(ref: Ref<IconHandle> | undefined, timing: IconTiming): SharedValue<number> {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useImperativeHandle(
    ref,
    () => ({
      startAnimation() {
        if (reduced) return;
        progress.value = withSequence(animateTo(1, timing), animateTo(0, timing));
      },
      stopAnimation() {
        cancelAnimation(progress);
        progress.value = 0;
      },
    }),
    [reduced, progress, timing],
  );

  return progress;
}

export { useIconMotion };
export type { AnimatedIconProps, IconHandle, IconTiming };

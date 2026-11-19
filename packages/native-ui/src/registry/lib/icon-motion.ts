/**
 * What every animated icon shares: the handle a control starts and stops it through, its props, and the
 * progress its parts are drawn from.
 */
import type { LucideProps } from 'lucide-react-native';
import { useImperativeHandle, type Ref } from 'react';
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withSequence,
  withTiming,
  type EasingFunction,
  type SharedValue,
} from 'react-native-reanimated';
import { useReducedMotion } from './motion';

declare module 'react-native-svg/lib/typescript/lib/extract/types' {
  /** Read by every native shape and group, and missing from react-native-svg's own types. */
  interface TransformProps {
    /** SVG's `matrix(a b c d e f)`, which the native view draws with in place of the other transform props. */
    matrix?: readonly number[];
  }
}

/** What a control holds an animated icon by, to play its motion when the control is pressed or focused. */
interface IconHandle {
  /** Plays the motion once, out and back; does nothing when the system asks for reduced motion. */
  startAnimation(): void;
  /** Puts the icon back at rest at once. */
  stopAnimation(): void;
}

/**
 * An animated icon's props: a lucide icon's, and the ref its {@link IconHandle} is handed through. An animated
 * icon ignores `absoluteStrokeWidth` and `nonScalingStroke`, drawing its stroke at `strokeWidth` in its 24-unit
 * viewBox at every size.
 */
type AnimatedIconProps = LucideProps & { ref?: Ref<IconHandle> };

/** The longest either way of an icon's motion runs, in ms, so out and back end within 500 ms. */
const MAX_LEG = 250;

/**
 * How each way of an icon's motion runs. An icon whose web twin springs takes the defaults; one whose web twin
 * runs for a duration takes half of it here.
 */
interface IconTiming {
  /** How long each way runs, in ms; 250, the most it may be, when left out or larger. */
  duration?: number;
  /** The easing of the way out, `Easing.out(Easing.cubic)` when left out. */
  outEasing?: EasingFunction;
  /** The easing of the way back, `Easing.inOut(Easing.cubic)` when left out. */
  backEasing?: EasingFunction;
}

const DEFAULT_TIMING: IconTiming = {};

/**
 * The progress an animated icon draws its parts from, 0 at rest and 1 at the far end of its motion, and the
 * handle `ref` receives. `startAnimation` runs it to 1 and back to 0 on `timing`; `stopAnimation` sets it to
 * 0 at once. While the system asks for reduced motion it never moves.
 * @param timing - pass a constant, since a new object hands `ref` a new handle on every render
 */
function useIconMotion(ref: Ref<IconHandle> | undefined, timing: IconTiming = DEFAULT_TIMING): SharedValue<number> {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useImperativeHandle(ref, () => {
    const duration = Math.min(timing.duration ?? MAX_LEG, MAX_LEG);
    const out = { duration, easing: timing.outEasing ?? Easing.out(Easing.cubic) };
    const back = { duration, easing: timing.backEasing ?? Easing.inOut(Easing.cubic) };
    return {
      startAnimation() {
        if (reduced) return;
        progress.value = withSequence(withTiming(1, out), withTiming(0, back));
      },
      stopAnimation() {
        cancelAnimation(progress);
        progress.value = 0;
      },
    };
  }, [reduced, progress, timing]);

  return progress;
}

/** The parts of a transform an animated icon moves a shape by, in its 24-unit viewBox. */
interface IconTransform {
  /** How far to move right, `0` when left out. */
  x?: number;
  /** How far to move down, `0` when left out. */
  y?: number;
  /** The horizontal scale, `1` when left out. */
  scaleX?: number;
  /** The vertical scale, `1` when left out. */
  scaleY?: number;
  /** The clockwise turn in degrees, `0` when left out. */
  rotate?: number;
  /** The x the scale and the turn keep fixed, `12` when left out. */
  originX?: number;
  /** The y the scale and the turn keep fixed, `12` when left out. */
  originY?: number;
}

/**
 * The transform of a shape or group as react-native-svg's native views read it: SVG's `matrix(a b c d e f)`.
 * An animated update reaches the native view without passing through react-native-svg's components, which
 * fold `translateX`, `rotation`, `originX` and the rest into `matrix` only when React renders them, so those
 * props would leave the shape where it is.
 */
interface IconTransformProps {
  matrix: [a: number, b: number, c: number, d: number, e: number, f: number];
}

/**
 * The transform of a shape or group, which turns about the origin, scales about it, then moves, as
 * react-native-svg composes it from the same props. A scale is kept at least 0.001 in size, since a matrix that
 * scales to 0 has no inverse to hit-test the shape with; its sign is kept, so a flip works.
 */
function transformProps({
  x = 0,
  y = 0,
  scaleX = 1,
  scaleY = 1,
  rotate = 0,
  originX = 12,
  originY = 12,
}: IconTransform): IconTransformProps {
  'worklet';
  const sx = Math.abs(scaleX) < 0.001 ? Math.sign(scaleX || 1) * 0.001 : scaleX;
  const sy = Math.abs(scaleY) < 0.001 ? Math.sign(scaleY || 1) * 0.001 : scaleY;
  const turn = (rotate * Math.PI) / 180;
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  const a = cos * sx;
  const b = sin * sx;
  const c = 0 - sin * sy;
  const d = cos * sy;
  return { matrix: [a, b, c, d, x + originX - (originX * a + originY * c), y + originY - (originX * b + originY * d)] };
}

/**
 * The stroke props that draw `fraction` of a path `length` units long, beginning `start` of the way along it. A
 * path drawn in full takes a dash longer than itself, so no cap sits where a closed path begins, and a path drawn
 * not at all takes no opacity, since a round cap would still leave a dot.
 */
function dash(
  length: number,
  fraction: number,
  start = 0,
): { strokeDasharray: number[]; strokeDashoffset: number; opacity: number } {
  'worklet';
  return {
    strokeDasharray: fraction >= 1 ? [2 * length, 2 * length] : [fraction * length, 2 * length],
    strokeDashoffset: 0 - start * length,
    opacity: fraction > 0 ? 1 : 0,
  };
}

export { dash, transformProps, useIconMotion };
export type { AnimatedIconProps, IconHandle, IconTiming, IconTransform, IconTransformProps };

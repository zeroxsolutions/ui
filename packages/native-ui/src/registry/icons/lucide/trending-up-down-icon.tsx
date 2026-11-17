// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import {
  dash,
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link TrendingUpDownIcon} through. */
type TrendingUpDownIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the line and its arrowhead in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the falling line, in the 24-unit viewBox. */
const FALL = 8.73;

/** The length of the rising line, in the 24-unit viewBox. */
const RISE = 26.87;

/** The length of each arrowhead, in the 24-unit viewBox, whose corner is half way along it. */
const HEAD = 10;

/**
 * How far the drawing drifts half way through the motion: the web twin's.
 */
const DRIFT_X = 2;

/**
 * The stroke of a part `length` units long, drawn in over its own stretch of the way back, from `start` to `end`
 * of it, beginning at its far end when `fromEnd`.
 */
function drawIn(
  progress: number,
  length: number,
  start: number,
  end: number,
  fromEnd = false,
): ReturnType<typeof dash> {
  'worklet';
  const drawn = interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP);
  return dash(length, drawn, fromEnd ? 1 - drawn : 0);
}

/** The arrowhead's stroke, drawn in from its corner outwards over the last stretch of the way back. */
function fromCorner(progress: number): ReturnType<typeof dash> {
  'worklet';
  const drawn = interpolate(1 - progress, [0.5, 1], [0, 1], Extrapolation.CLAMP);
  return dash(HEAD, drawn, (1 - drawn) / 2);
}

/**
 * Lucide's trending-up-down icon, whose lines are drawn in again to their arrowheads as it drifts to the right, and
 * back when started. Hidden from a screen reader: the control around it says what it does.
 */
function TrendingUpDownIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const whole = useAnimatedProps(() => {
    return transformProps({
      x: interpolate(progress.value, [0, 0.5, 1], [0, DRIFT_X, 0]),
    });
  });
  const fall = useAnimatedProps(() => drawIn(progress.value, FALL, 0, 2 / 3));
  const rise = useAnimatedProps(() => drawIn(progress.value, RISE, 0, 2 / 3, true));
  const fallHead = useAnimatedProps(() => fromCorner(progress.value));
  const riseHead = useAnimatedProps(() => fromCorner(progress.value));

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <AnimatedG animatedProps={whole}>
        <AnimatedPath d="M14.828 14.828 21 21" animatedProps={fall} />
        <AnimatedPath d="m21 3-9 9-4-4-6 6" animatedProps={rise} />
        <AnimatedPath d="M21 16v5h-5" animatedProps={fallHead} />
        <AnimatedPath d="M21 8V3h-5" animatedProps={riseHead} />
      </AnimatedG>
    </Svg>
  );
}

export { TrendingUpDownIcon };
export type { TrendingUpDownIconHandle };

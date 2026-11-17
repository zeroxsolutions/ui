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

/** The handle a control starts and stops {@link TrendingDownIcon} through. */
type TrendingDownIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the line and its arrowhead in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the line, in the 24-unit viewBox. */
const LINE = 28.28;

/** The length of the arrowhead, in the 24-unit viewBox, whose corner is half way along it. */
const HEAD = 12;

/**
 * How far the drawing drifts half way through the motion, and its size there about the line's start (2, 7): the web
 * twin's drift would take the arrowhead past the canvas, which react-native-svg clips, so it shrinks a little.
 */
const DRIFT_X = 2;
const DRIFT_Y = 2;
const SIZE = 0.95;

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
 * Lucide's trending-down icon, whose line is drawn in again down to its arrowhead as it drifts down and to the right,
 * and back when started. Hidden from a screen reader: the control around it says what it does.
 */
function TrendingDownIcon({
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
    const size = interpolate(progress.value, [0, 0.5, 1], [1, SIZE, 1]);
    return transformProps({
      x: interpolate(progress.value, [0, 0.5, 1], [0, DRIFT_X, 0]),
      y: interpolate(progress.value, [0, 0.5, 1], [0, DRIFT_Y, 0]),
      scaleX: size,
      scaleY: size,
      originX: 2,
      originY: 7,
    });
  });
  const line = useAnimatedProps(() => drawIn(progress.value, LINE, 0, 2 / 3, true));
  const head = useAnimatedProps(() => fromCorner(progress.value));

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
        <AnimatedPath d="m22 17-8.5-8.5-5 5L2 7" animatedProps={line} />
        <AnimatedPath d="M16 17h6v-6" animatedProps={head} />
      </AnimatedG>
    </Svg>
  );
}

export { TrendingDownIcon };
export type { TrendingDownIconHandle };

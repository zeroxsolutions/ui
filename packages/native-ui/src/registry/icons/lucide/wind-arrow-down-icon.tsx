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

/** The handle a control starts and stops {@link WindArrowDownIcon} through. */
type WindArrowDownIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the gusts and drops the arrow in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the low gust and the middle gust, in the 24-unit viewBox. */
const LOW = 19.57;
const MIDDLE = 27.67;

/** The stretch of the way back the arrow drops in over: the web twin's 0.35 s delay and 0.5 s, in proportion. */
const ARROW = [0.214, 0.929];

/**
 * How far above its place the arrow starts and its size there about its tip (10, 10): the web twin drops it from 10
 * above, past the canvas, which react-native-svg clips, so it drops from 3 above, growing as it comes.
 */
const DROP = 3;
const SIZE = 0.7;

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

/**
 * Lucide's wind-arrow-down icon, whose gusts are drawn in again as its arrow drops in from above when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function WindArrowDownIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const low = useAnimatedProps(() => drawIn(progress.value, LOW, 0, 5 / 7, true));
  const middle = useAnimatedProps(() => drawIn(progress.value, MIDDLE, 2 / 7, 1, true));
  const arrow = useAnimatedProps(() => {
    const dropped = interpolate(1 - progress.value, ARROW, [0, 1], Extrapolation.CLAMP);
    const size = SIZE + (1 - SIZE) * dropped;
    return {
      opacity: dropped,
      ...transformProps({ y: -DROP * (1 - dropped), scaleX: size, scaleY: size, originX: 10, originY: 10 }),
    };
  });

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
      <AnimatedPath d="M12.8 21.6A2 2 0 1 0 14 18H2" animatedProps={low} />
      <AnimatedPath d="M17.5 10a2.5 2.5 0 1 1 2 4H2" animatedProps={middle} />
      <AnimatedG animatedProps={arrow}>
        <Path d="M10 2v8" />
        <Path d="m6 6 4 4 4-4" />
      </AnimatedG>
    </Svg>
  );
}

export { WindArrowDownIcon };
export type { WindArrowDownIconHandle };

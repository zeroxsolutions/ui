// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link WindIcon} through. */
type WindIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the low gust, in the 24-unit viewBox. */
const LOW = 19.57;

/** The length of the middle gust, in the 24-unit viewBox. */
const MIDDLE = 27.67;

/** The length of the high gust, in the 24-unit viewBox. */
const HIGH = 16.57;

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
 * Lucide's wind icon, whose gusts are drawn in again from their curls, the middle one first when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function WindIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const low = useAnimatedProps(() => drawIn(progress.value, LOW, 2 / 9, 7 / 9, true));
  const middle = useAnimatedProps(() => drawIn(progress.value, MIDDLE, 0, 5 / 9, true));
  const high = useAnimatedProps(() => drawIn(progress.value, HIGH, 4 / 9, 1, true));

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
      <AnimatedPath d="M12.8 19.6A2 2 0 1 0 14 16H2" animatedProps={low} />
      <AnimatedPath d="M17.5 8a2.5 2.5 0 1 1 2 4H2" animatedProps={middle} />
      <AnimatedPath d="M9.8 4.4A2 2 0 1 1 11 8H2" animatedProps={high} />
    </Svg>
  );
}

export { WindIcon };
export type { WindIconHandle };

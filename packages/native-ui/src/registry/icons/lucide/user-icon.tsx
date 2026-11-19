// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  dash,
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link UserIcon} through. */
type UserIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the head, a circle of radius 4, and of the shoulders, in the 24-unit viewBox. */
const HEAD = 25.13;
const SHOULDERS = 22.57;

/** The size the head grows from about its middle (12, 7): the web twin's. */
const HEAD_FROM = 0.5;

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
 * Lucide's user icon, whose head is drawn in again as it grows, then its shoulders when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function UserIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const head = useAnimatedProps(() => {
    const size = interpolate(1 - progress.value, [0, 0.5], [HEAD_FROM, 1], Extrapolation.CLAMP);
    return {
      ...drawIn(progress.value, HEAD, 0, 0.5, true),
      ...transformProps({ scaleX: size, scaleY: size, originX: 12, originY: 7 }),
    };
  });
  const shoulders = useAnimatedProps(() => drawIn(progress.value, SHOULDERS, 1 / 3, 1, true));

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
      <AnimatedCircle cx="12" cy="7" r="4" animatedProps={head} />
      <AnimatedPath d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" animatedProps={shoulders} />
    </Svg>
  );
}

export { UserIcon };
export type { UserIconHandle };

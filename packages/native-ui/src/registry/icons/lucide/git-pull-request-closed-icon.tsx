// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link GitPullRequestClosedIcon} through. */
type GitPullRequestClosedIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of each ring, 2 pi 3, in the 24-unit viewBox. */
const RING = 18.85;

/** The length of the trunk, in the 24-unit viewBox. */
const TRUNK = 12;

/** The length of the stub under the cross, in the 24-unit viewBox. */
const STUB = 3.38;

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

/** The opacity of a part that fades in over its own stretch of the way back, from `start` to `end` of it. */
function fadeIn(progress: number, start: number, end: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP) };
}

/**
 * Lucide's git-pull-request-closed icon, whose commits, the lines from them and the cross are drawn in again one after
 * another when started. Hidden from a screen reader: the control around it says what it does.
 */
function GitPullRequestClosedIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const base = useAnimatedProps(() => drawIn(progress.value, RING, 0, 0.2));
  const trunk = useAnimatedProps(() => drawIn(progress.value, TRUNK, 0.2, 0.4, true));
  const crossUp = useAnimatedProps(() => fadeIn(progress.value, 0.4, 0.6));
  const crossDown = useAnimatedProps(() => fadeIn(progress.value, 0.4, 0.6));
  const stub = useAnimatedProps(() => drawIn(progress.value, STUB, 0.6, 0.8, true));
  const head = useAnimatedProps(() => drawIn(progress.value, RING, 0.8, 1));

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
      <AnimatedCircle cx="6" cy="6" r="3" animatedProps={base} />
      <AnimatedPath d="M6 9v12" animatedProps={trunk} />
      <AnimatedPath d="m15.5 8.5 5-5" animatedProps={crossUp} />
      <AnimatedPath d="m15.5 3.5 5 5" animatedProps={crossDown} />
      <AnimatedPath d="M18 11.62V15" animatedProps={stub} />
      <AnimatedCircle cx="18" cy="18" r="3" animatedProps={head} />
    </Svg>
  );
}

export { GitPullRequestClosedIcon };
export type { GitPullRequestClosedIconHandle };

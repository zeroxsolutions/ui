// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link GitPullRequestCreateIcon} through. */
type GitPullRequestCreateIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of each ring, 2 pi 3, in the 24-unit viewBox. */
const RING = 18.85;

/** The length of the trunk, in the 24-unit viewBox. */
const TRUNK = 12;

/** The length of the request, in the 24-unit viewBox. */
const REQUEST = 9.14;

/** The length of the stem of the plus, in the 24-unit viewBox. */
const STEM = 6;

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
 * Lucide's git-pull-request-create icon, whose commit, the lines and the plus are drawn in again one after another when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function GitPullRequestCreateIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const base = useAnimatedProps(() => drawIn(progress.value, RING, 0, 0.25));
  const trunk = useAnimatedProps(() => drawIn(progress.value, TRUNK, 0.25, 0.5, true));
  const request = useAnimatedProps(() => drawIn(progress.value, REQUEST, 0.5, 0.75, true));
  const stem = useAnimatedProps(() => drawIn(progress.value, STEM, 0.5, 0.75, true));
  const bar = useAnimatedProps(() => fadeIn(progress.value, 0.75, 1));

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
      <AnimatedPath d="M13 6h3a2 2 0 0 1 2 2v3" animatedProps={request} />
      <AnimatedPath d="M18 15v6" animatedProps={stem} />
      <AnimatedPath d="M21 18h-6" animatedProps={bar} />
    </Svg>
  );
}

export { GitPullRequestCreateIcon };
export type { GitPullRequestCreateIconHandle };

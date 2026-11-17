// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link GitCommitHorizontalIcon} through. */
type GitCommitHorizontalIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of each ring, 2 pi 3, in the 24-unit viewBox. */
const RING = 18.85;

/** The length of each line, in the 24-unit viewBox. */
const LINE = 6;

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
 * Lucide's git-commit-horizontal icon, whose commit and the lines either side of it are drawn in again from left to
 * right when started. Hidden from a screen reader: the control around it says what it does.
 */
function GitCommitHorizontalIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const commit = useAnimatedProps(() => drawIn(progress.value, RING, 0.25, 0.75));
  const left = useAnimatedProps(() => drawIn(progress.value, LINE, 0, 0.5));
  const right = useAnimatedProps(() => drawIn(progress.value, LINE, 0.5, 1));

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
      <AnimatedCircle cx="12" cy="12" r="3" animatedProps={commit} />
      <AnimatedLine x1="3" x2="9" y1="12" y2="12" animatedProps={left} />
      <AnimatedLine x1="15" x2="21" y1="12" y2="12" animatedProps={right} />
    </Svg>
  );
}

export { GitCommitHorizontalIcon };
export type { GitCommitHorizontalIconHandle };

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link GitCommitVerticalIcon} through. */
type GitCommitVerticalIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

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
 * Lucide's git-commit-vertical icon, whose commit and the lines either side of it are drawn in again from top to bottom
 * when started. Hidden from a screen reader: the control around it says what it does.
 */
function GitCommitVerticalIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const top = useAnimatedProps(() => drawIn(progress.value, LINE, 0, 0.5));
  const commit = useAnimatedProps(() => drawIn(progress.value, RING, 0.25, 0.75));
  const bottom = useAnimatedProps(() => drawIn(progress.value, LINE, 0.5, 1));

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
      <AnimatedPath d="M12 3v6" animatedProps={top} />
      <AnimatedCircle cx="12" cy="12" r="3" animatedProps={commit} />
      <AnimatedPath d="M12 15v6" animatedProps={bottom} />
    </Svg>
  );
}

export { GitCommitVerticalIcon };
export type { GitCommitVerticalIconHandle };

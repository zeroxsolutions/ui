// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link GitForkIcon} through. */
type GitForkIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of each ring, 2 pi 3, in the 24-unit viewBox. */
const RING = 18.85;

/** The length of the fork, in the 24-unit viewBox. */
const FORK = 17.18;

/** The length of the stem, in the 24-unit viewBox. */
const STEM = 3;

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
 * Lucide's git-fork icon, whose commits and the fork between them are drawn in again one after another when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function GitForkIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const base = useAnimatedProps(() => drawIn(progress.value, RING, 0, 1 / 3));
  const left = useAnimatedProps(() => drawIn(progress.value, RING, 2 / 3, 1));
  const right = useAnimatedProps(() => drawIn(progress.value, RING, 2 / 3, 1));
  const fork = useAnimatedProps(() => drawIn(progress.value, FORK, 1 / 3, 2 / 3, true));
  const stem = useAnimatedProps(() => drawIn(progress.value, STEM, 1 / 3, 2 / 3, true));

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
      <AnimatedCircle cx="12" cy="18" r="3" animatedProps={base} />
      <AnimatedCircle cx="6" cy="6" r="3" animatedProps={left} />
      <AnimatedCircle cx="18" cy="6" r="3" animatedProps={right} />
      <AnimatedPath d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" animatedProps={fork} />
      <AnimatedPath d="M12 12v3" animatedProps={stem} />
    </Svg>
  );
}

export { GitForkIcon };
export type { GitForkIconHandle };

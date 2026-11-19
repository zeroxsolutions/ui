// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link GitCompareIcon} through. */
type GitCompareIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of each ring, 2 pi 3, in the 24-unit viewBox. */
const RING = 18.85;

/** The length of each line, in the 24-unit viewBox. */
const LINE = 13.14;

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
 * Lucide's git-compare icon, whose commits and the lines between them are drawn in again one after another when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function GitCompareIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const target = useAnimatedProps(() => drawIn(progress.value, RING, 0, 1 / 3));
  const source = useAnimatedProps(() => drawIn(progress.value, RING, 2 / 3, 1));
  const toTarget = useAnimatedProps(() => drawIn(progress.value, LINE, 1 / 3, 2 / 3, true));
  const toSource = useAnimatedProps(() => drawIn(progress.value, LINE, 1 / 3, 2 / 3, true));

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
      <AnimatedCircle cx="18" cy="18" r="3" animatedProps={target} />
      <AnimatedCircle cx="6" cy="6" r="3" animatedProps={source} />
      <AnimatedPath d="M13 6h3a2 2 0 0 1 2 2v7" animatedProps={toTarget} />
      <AnimatedPath d="M11 18H8a2 2 0 0 1-2-2V9" animatedProps={toSource} />
    </Svg>
  );
}

export { GitCompareIcon };
export type { GitCompareIconHandle };

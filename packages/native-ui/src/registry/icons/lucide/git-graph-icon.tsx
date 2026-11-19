// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link GitGraphIcon} through. */
type GitGraphIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of each ring, 2 pi 3, in the 24-unit viewBox. */
const RING = 18.85;

/** The length of the line between the left commits, in the 24-unit viewBox. */
const SHORT = 6;

/** The length of the trunk, in the 24-unit viewBox. */
const TRUNK = 18;

/** The length of the curve, in the 24-unit viewBox. */
const CURVE = 7.56;

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
 * Lucide's git-graph icon, whose commits and the lines between them are drawn in again one after another when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function GitGraphIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const top = useAnimatedProps(() => drawIn(progress.value, RING, 0, 1 / 3));
  const link = useAnimatedProps(() => drawIn(progress.value, SHORT, 1 / 3, 2 / 3, true));
  const bottom = useAnimatedProps(() => drawIn(progress.value, RING, 2 / 3, 1));
  const trunk = useAnimatedProps(() => drawIn(progress.value, TRUNK, 1 / 3, 2 / 3, true));
  const head = useAnimatedProps(() => drawIn(progress.value, RING, 2 / 3, 1));
  const curve = useAnimatedProps(() => drawIn(progress.value, CURVE, 1 / 3, 2 / 3, true));

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
      <AnimatedCircle cx="5" cy="6" r="3" animatedProps={top} />
      <AnimatedPath d="M5 9v6" animatedProps={link} />
      <AnimatedCircle cx="5" cy="18" r="3" animatedProps={bottom} />
      <AnimatedPath d="M12 3v18" animatedProps={trunk} />
      <AnimatedCircle cx="19" cy="6" r="3" animatedProps={head} />
      <AnimatedPath d="M16 15.7A9 9 0 0 0 19 9" animatedProps={curve} />
    </Svg>
  );
}

export { GitGraphIcon };
export type { GitGraphIconHandle };

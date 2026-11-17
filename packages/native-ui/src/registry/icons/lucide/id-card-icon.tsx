// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link IdCardIcon} through. */
type IdCardIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the shoulders, half of 2 pi 4, in the 24-unit viewBox. */
const SHOULDERS = 12.57;

/** The length of the head, 2 pi 3, in the 24-unit viewBox. */
const HEAD = 18.85;

/** The length of each line, in the 24-unit viewBox. */
const LINE = 2;

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
 * Lucide's id-card icon, whose holder's shoulders, head and lines are drawn in again one after another when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function IdCardIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const shoulders = useAnimatedProps(() => drawIn(progress.value, SHOULDERS, 0, 0.6));
  const upperLine = useAnimatedProps(() => drawIn(progress.value, LINE, 0.4, 1));
  const lowerLine = useAnimatedProps(() => drawIn(progress.value, LINE, 0.4, 1));
  const head = useAnimatedProps(() => drawIn(progress.value, HEAD, 0.2, 0.8));

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
      <AnimatedPath d="M13 19a4 4 0 00-8 0" animatedProps={shoulders} />
      <AnimatedPath d="M16 10h2" animatedProps={upperLine} />
      <AnimatedPath d="M16 14h2" animatedProps={lowerLine} />
      <AnimatedCircle cx="9" cy="12" r="3" animatedProps={head} />
      <Rect x="2" y="5" width="20" height="14" rx="2" />
    </Svg>
  );
}

export { IdCardIcon };
export type { IdCardIconHandle };

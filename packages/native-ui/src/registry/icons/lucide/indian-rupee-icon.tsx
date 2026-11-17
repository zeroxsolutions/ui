// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link IndianRupeeIcon} through. */
type IndianRupeeIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the stroke from the top through the bowl to the foot, in the 24-unit viewBox. */
const STROKE = 28;

/** The length of each bar, in the 24-unit viewBox. */
const BAR = 12;

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
 * Lucide's indian-rupee icon, which is drawn in again, its bars last when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function IndianRupeeIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const stroke = useAnimatedProps(() => drawIn(progress.value, STROKE, 0, 2 / 3));
  const upperBar = useAnimatedProps(() => drawIn(progress.value, BAR, 5 / 9, 1, true));
  const lowerBar = useAnimatedProps(() => drawIn(progress.value, BAR, 5 / 9, 1, true));

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
      <AnimatedPath d="m14 20-8-8h4c5.333 0 5.333-8 0-8" animatedProps={stroke} />
      <AnimatedPath d="M6 4h12" animatedProps={upperBar} />
      <AnimatedPath d="M6 8h12" animatedProps={lowerBar} />
    </Svg>
  );
}

export { IndianRupeeIcon };
export type { IndianRupeeIconHandle };

// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link PhilippinePesoIcon} through. */
type PhilippinePesoIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the stroke from the foot through the bowl, in the 24-unit viewBox. */
const STROKE = 46.42;

/** The length of each bar, in the 24-unit viewBox. */
const BAR = 16;

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
 * Lucide's philippine-peso icon, which is drawn in again, its bars last when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function PhilippinePesoIcon({
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
  const lowerBar = useAnimatedProps(() => drawIn(progress.value, BAR, 5 / 9, 1, true));
  const upperBar = useAnimatedProps(() => drawIn(progress.value, BAR, 5 / 9, 1, true));

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
      <AnimatedPath d="M6 20V5a1 1 0 011-1h5a6 6 0 010 12H6" animatedProps={stroke} />
      <AnimatedPath d="M4 12h16" animatedProps={lowerBar} />
      <AnimatedPath d="M4 8h16" animatedProps={upperBar} />
    </Svg>
  );
}

export { PhilippinePesoIcon };
export type { PhilippinePesoIconHandle };

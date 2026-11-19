// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link RouteIcon} through. */
type RouteIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of each stop's circle and of the road, in the 24-unit viewBox. */
const STOP = 18.85;
const ROAD = 49.99;

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
 * Lucide's route icon, whose stops and the road between them are drawn in again when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function RouteIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const start = useAnimatedProps(() => drawIn(progress.value, STOP, 0, 1 / 3));
  const end = useAnimatedProps(() => drawIn(progress.value, STOP, 0, 1 / 3));
  // The road waits for the stops and is drawn from its far end, as the web twin's waits 0.5 s and runs its pathOffset.
  const road = useAnimatedProps(() => drawIn(progress.value, ROAD, 5 / 12, 1, true));

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
      <AnimatedCircle cx="6" cy="5" r="3" animatedProps={start} />
      <AnimatedPath d="M9 5h8.5a1 1 0 010 7h-11a1 1 0 000 7H15" animatedProps={road} />
      <AnimatedCircle cx="18" cy="19" r="3" animatedProps={end} />
    </Svg>
  );
}

export { RouteIcon };
export type { RouteIconHandle };
